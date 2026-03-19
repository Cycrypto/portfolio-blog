import { createHash } from 'crypto';

export interface IdeaInputMessage {
  order: number;
  role: 'user' | 'assistant' | 'unknown';
  text: string;
}

export interface ExtractedIdeaCandidate {
  title: string;
  category: string;
  tags: string[];
  keywords: string[];
  evidenceSnippet: string;
  score: number;
}

interface TokenStats {
  turns: Set<number>;
  roles: Set<IdeaInputMessage['role']>;
  codeTurns: Set<number>;
  problemTurns: Set<number>;
  solutionTurns: Set<number>;
  titleMatched: boolean;
}

interface MessageContext {
  role: IdeaInputMessage['role'];
  order: number;
  originalText: string;
  cleanText: string;
  codeText: string;
  techTokens: string[];
  actionTokens: string[];
  phrases: string[];
  hasCode: boolean;
  hasProblem: boolean;
  hasSolution: boolean;
  sentences: string[];
}

const MAX_CANDIDATES = 5;
const MAX_SNIPPET_LENGTH = 140;
const GENERIC_FALLBACK_LABEL = '핵심 포인트';

const TECH_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'React', pattern: /\breact\b/i },
  { label: 'Next.js', pattern: /\bnext(?:\.js)?\b/i },
  { label: 'NestJS', pattern: /\bnest(?:js|\.js)?\b/i },
  { label: 'TypeORM', pattern: /\btypeorm\b/i },
  { label: 'PostgreSQL', pattern: /\bpostgres(?:ql)?\b/i },
  { label: 'Docker', pattern: /\bdocker\b/i },
  { label: 'GCP', pattern: /\bgcp\b|\bgoogle cloud\b/i },
  { label: 'AWS', pattern: /\baws\b/i },
  { label: 'Cloud Run', pattern: /\bcloud run\b/i },
  { label: 'Vercel', pattern: /\bvercel\b/i },
  { label: 'GitHub Actions', pattern: /\bgithub actions\b/i },
  { label: 'Nginx', pattern: /\bnginx\b/i },
  { label: 'Tailwind', pattern: /\btailwind\b/i },
  { label: 'CSS', pattern: /\bcss\b/i },
  { label: 'Node.js', pattern: /\bnode(?:\.js)?\b/i },
  { label: 'API', pattern: /\bapi\b/i },
  { label: 'Auth', pattern: /\bauth(?:entication)?\b|인증/i },
  { label: 'Server', pattern: /\bserver\b|서버/i },
  { label: 'SQL', pattern: /\bsql\b/i },
  { label: 'Migration', pattern: /\bmigration\b|마이그레이션/i },
  { label: 'Query', pattern: /\bquery\b|쿼리/i },
  { label: 'Browser', pattern: /\bbrowser\b|브라우저/i },
  { label: 'UI', pattern: /\bui\b|\bux\b/i },
];

const ACTION_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: '에러', pattern: /\berror\b|에러|오류|문제|안됨|실패/i },
  { label: '해결', pattern: /해결|fix|수정|대응/i },
  { label: '구현', pattern: /구현|implement|작성|만들기|개발/i },
  { label: '비교', pattern: /비교|compare/i },
  { label: '최적화', pattern: /최적화|optimi/i },
  { label: '마이그레이션', pattern: /migration|마이그레이션/i },
  { label: '배포', pattern: /deploy|배포/i },
  { label: '리팩토링', pattern: /refactor|리팩토링/i },
  { label: '정리', pattern: /정리|요약|체크리스트/i },
  { label: '연동', pattern: /연동|통합|connect/i },
];

const PROBLEM_PATTERN = /\berror\b|에러|오류|문제|안됨|실패|막힘/i;
const SOLUTION_PATTERN = /해결|fix|수정|대응|정리|개선/i;

const EN_STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'this',
  'to',
  'we',
  'with',
  'you',
]);

const KO_STOPWORDS = new Set([
  '그',
  '그리고',
  '근데',
  '관련',
  '그냥',
  '나는',
  '내가',
  '너무',
  '다시',
  '대한',
  '문제',
  '에서',
  '으로',
  '이건',
  '이게',
  '있는',
  '있다',
  '정도',
  '지금',
  '하는',
  '해서',
  '하면',
  '합니다',
  '해요',
]);

const CODE_STOPWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'return',
  'import',
  'from',
  'export',
  'default',
  'class',
  'async',
  'await',
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'props',
  'state',
  'value',
  'type',
  'null',
  'true',
  'false',
]);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  frontend: [
    'React',
    'Next.js',
    'CSS',
    'Tailwind',
    'UI',
    'Browser',
    '.tsx',
    '.jsx',
  ],
  backend: ['NestJS', 'Node.js', 'API', 'Auth', 'Server', '.ts', '.js'],
  devops: ['Docker', 'GitHub Actions', 'Nginx', 'deploy', '배포'],
  cloud: ['GCP', 'AWS', 'Cloud Run', 'Vercel', 'storage'],
  database: ['PostgreSQL', 'TypeORM', 'SQL', 'Migration', 'Query', '.sql'],
};

const ACTION_TITLE_LABELS: Record<string, string> = {
  에러: '오류',
  해결: '문제',
  구현: '기능',
  비교: '비교 포인트',
  최적화: '최적화',
  마이그레이션: '마이그레이션',
  배포: '배포',
  리팩토링: '리팩토링',
  정리: '핵심 포인트',
  연동: '연동',
};

export function createSourceFingerprint(
  sourceUrl: string,
  messages: IdeaInputMessage[],
): string {
  const normalizedText = normalizeConversationText(messages);
  return createHash('sha256')
    .update(`${sourceUrl}::${normalizedText}`)
    .digest('hex');
}

export function normalizeConversationText(messages: IdeaInputMessage[]): string {
  return messages
    .map((message) => normalizeWhitespace(stripMarkdownArtifacts(message.text)))
    .join('\n')
    .trim();
}

export function extractIdeaCandidates(input: {
  sourceTitle: string;
  messages: IdeaInputMessage[];
}): ExtractedIdeaCandidate[] {
  const sanitizedTitle = sanitizeSourceTitle(input.sourceTitle);
  const contexts = buildMessageContexts(input.messages);
  const technicalStats = collectTechnicalStats(sanitizedTitle, contexts);
  const actionRanking = collectActionRanking(contexts);
  const pairScores = collectPairScores(contexts, technicalStats);
  const technicalRanking = [...technicalStats.entries()].sort(
    (left, right) => scoreTokenStats(right[1]) - scoreTokenStats(left[1]),
  );

  const candidates: ExtractedIdeaCandidate[] = [];
  const seenTitles = new Set<string>();

  for (const [pairKey, pairScore] of [...pairScores.entries()].sort(
    (left, right) => right[1] - left[1],
  )) {
    if (candidates.length >= MAX_CANDIDATES) {
      break;
    }

    const [techToken, actionToken] = pairKey.split('::');
    const techStats = technicalStats.get(techToken);
    if (!techStats) {
      continue;
    }

    const title = buildCandidateTitle(techToken, actionToken);
    if (seenTitles.has(title)) {
      continue;
    }

    const keywords = buildKeywords(
      techToken,
      actionToken,
      contexts,
      technicalRanking.map(([token]) => token),
    );
    const evidenceSnippet = pickEvidenceSnippet(contexts, techToken, actionToken);
    const tags = keywords.filter((keyword) => isTechnicalKeyword(keyword)).slice(0, 3);
    const category = inferCategory([techToken, ...keywords], title);

    candidates.push({
      title,
      category,
      tags: tags.length > 0 ? tags : [techToken].slice(0, 3),
      keywords: keywords.slice(0, 6),
      evidenceSnippet,
      score: scoreTokenStats(techStats) + pairScore,
    });
    seenTitles.add(title);
  }

  for (const [techToken] of technicalRanking) {
    if (candidates.length >= MAX_CANDIDATES) {
      break;
    }

    const actionToken = actionRanking[0] ?? '정리';
    const title = buildCandidateTitle(techToken, actionToken);
    if (seenTitles.has(title)) {
      continue;
    }

    candidates.push({
      title,
      category: inferCategory([techToken], title),
      tags: [techToken].slice(0, 3),
      keywords: [techToken, actionToken],
      evidenceSnippet: pickEvidenceSnippet(contexts, techToken, actionToken),
      score: scoreTokenStats(technicalStats.get(techToken)!),
    });
    seenTitles.add(title);
  }

  if (candidates.length < 2) {
    const genericTitle = `${sanitizeGenericLabel(
      technicalRanking[0]?.[0] || sanitizedTitle || '대화',
    )} 관련 실전 체크리스트`;

    if (!seenTitles.has(genericTitle)) {
      candidates.push({
        title: genericTitle,
        category: inferCategory(
          [technicalRanking[0]?.[0] || sanitizedTitle],
          genericTitle,
        ),
        tags: technicalRanking.slice(0, 3).map(([token]) => token),
        keywords: [technicalRanking[0]?.[0] || sanitizedTitle, '정리'].filter(
          Boolean,
        ) as string[],
        evidenceSnippet:
          contexts[0]?.sentences[0] ||
          sanitizedTitle ||
          '현재 대화에서 정리할 만한 실전 포인트가 있습니다.',
        score: 1,
      });
      seenTitles.add(genericTitle);
    }
  }

  return candidates
    .map((candidate) => ({
      ...candidate,
      evidenceSnippet: trimSnippet(candidate.evidenceSnippet),
      tags: uniqueStrings(candidate.tags).slice(0, 3),
      keywords: uniqueStrings(candidate.keywords).slice(0, 6),
    }))
    .slice(0, MAX_CANDIDATES);
}

function buildMessageContexts(messages: IdeaInputMessage[]): MessageContext[] {
  return messages
    .map((message) => {
      const originalText = normalizeWhitespace(message.text);
      const codeBlocks = [...originalText.matchAll(/```([\s\S]*?)```/g)].map(
        (match) => match[1].trim(),
      );
      const cleanText = normalizeWhitespace(
        stripMarkdownArtifacts(originalText.replace(/```[\s\S]*?```/g, ' ')),
      );
      const codeText = normalizeWhitespace(codeBlocks.join(' '));
      const mergedText = `${cleanText} ${codeText}`.trim();
      const techTokens = extractTechnicalTokens(mergedText, codeText);
      const actionTokens = extractActionTokens(cleanText);
      const phrases = extractPhrases(cleanText);
      const sentences = splitSentences(cleanText);

      return {
        role: message.role,
        order: message.order,
        originalText,
        cleanText,
        codeText,
        techTokens,
        actionTokens,
        phrases,
        hasCode: codeBlocks.length > 0,
        hasProblem: PROBLEM_PATTERN.test(cleanText),
        hasSolution: SOLUTION_PATTERN.test(cleanText),
        sentences,
      };
    })
    .filter((context) => context.originalText.length > 0);
}

function collectTechnicalStats(
  sourceTitle: string,
  contexts: MessageContext[],
): Map<string, TokenStats> {
  const titleLower = sourceTitle.toLowerCase();
  const stats = new Map<string, TokenStats>();

  for (const context of contexts) {
    for (const token of context.techTokens) {
      const existing = stats.get(token) || {
        turns: new Set<number>(),
        roles: new Set<IdeaInputMessage['role']>(),
        codeTurns: new Set<number>(),
        problemTurns: new Set<number>(),
        solutionTurns: new Set<number>(),
        titleMatched: false,
      };

      existing.turns.add(context.order);
      existing.roles.add(context.role);
      if (context.hasCode) {
        existing.codeTurns.add(context.order);
      }
      if (context.hasProblem) {
        existing.problemTurns.add(context.order);
      }
      if (context.hasSolution) {
        existing.solutionTurns.add(context.order);
      }
      if (titleLower.includes(token.toLowerCase())) {
        existing.titleMatched = true;
      }

      stats.set(token, existing);
    }
  }

  return stats;
}

function collectActionRanking(contexts: MessageContext[]): string[] {
  const counts = new Map<string, number>();

  for (const context of contexts) {
    for (const token of context.actionTokens) {
      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([token]) => token);
}

function collectPairScores(
  contexts: MessageContext[],
  technicalStats: Map<string, TokenStats>,
): Map<string, number> {
  const pairScores = new Map<string, number>();

  for (const context of contexts) {
    const fallbackActions = context.actionTokens.length > 0 ? context.actionTokens : ['정리'];

    for (const techToken of context.techTokens) {
      for (const actionToken of fallbackActions) {
        const key = `${techToken}::${actionToken}`;
        const pairScore =
          1 +
          (context.hasCode ? 2 : 0) +
          (context.hasProblem ? 2 : 0) +
          (context.hasSolution ? 1 : 0) +
          Math.min(context.phrases.length, 2);

        pairScores.set(
          key,
          (pairScores.get(key) || 0) +
            pairScore +
            Math.floor(scoreTokenStats(technicalStats.get(techToken)!) / 3),
        );
      }
    }
  }

  return pairScores;
}

function scoreTokenStats(stats: TokenStats): number {
  return (
    stats.turns.size * 3 +
    (stats.roles.has('user') && stats.roles.has('assistant') ? 2 : 0) +
    (stats.codeTurns.size > 0 ? 2 : 0) +
    (stats.problemTurns.size > 0 ? 2 : 0) +
    (stats.solutionTurns.size > 0 ? 1 : 0) +
    (stats.titleMatched ? 2 : 0)
  );
}

function extractTechnicalTokens(cleanText: string, codeText: string): string[] {
  const tokens = new Set<string>();

  for (const techPattern of TECH_PATTERNS) {
    if (techPattern.pattern.test(cleanText) || techPattern.pattern.test(codeText)) {
      tokens.add(techPattern.label);
    }
  }

  const rawCodeTokens = [
    ...codeText.matchAll(/\b[a-z0-9._-]+\.(?:ts|tsx|js|jsx|json|sql|yml|yaml|md|mdx)\b/gi),
    ...codeText.matchAll(/\b@[a-z0-9-]+\/[a-z0-9-._]+\b/gi),
    ...codeText.matchAll(/\b[A-Z][A-Za-z0-9]{2,}\b/g),
    ...codeText.matchAll(/\b[a-z]+(?:[A-Z][a-z0-9]+)+\b/g),
  ]
    .map((match) => match[0])
    .filter((token) => token.length >= 3 && token.length <= 40)
    .filter((token) => !CODE_STOPWORDS.has(token.toLowerCase()));

  for (const token of rawCodeTokens) {
    tokens.add(normalizeTechToken(token));
  }

  return [...tokens].slice(0, 10);
}

function extractActionTokens(cleanText: string): string[] {
  const tokens = new Set<string>();

  for (const pattern of ACTION_PATTERNS) {
    if (pattern.pattern.test(cleanText)) {
      tokens.add(pattern.label);
    }
  }

  return [...tokens];
}

function extractPhrases(cleanText: string): string[] {
  const words = cleanText
    .split(/[\s,./()[\]{}:;!?]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2)
    .filter((word) => !isStopword(word));

  const phrases = new Set<string>();

  for (let index = 0; index < words.length - 1; index += 1) {
    const nextWords = words.slice(index, index + 3);
    if (nextWords.length < 2) {
      continue;
    }

    const phrase = nextWords.join(' ');
    if (phrase.length >= 4 && phrase.length <= 30) {
      phrases.add(phrase);
    }
  }

  return [...phrases].slice(0, 5);
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter((sentence) => sentence.length >= 10);
}

function buildCandidateTitle(techToken: string, actionToken: string): string {
  const actionLabel = ACTION_TITLE_LABELS[actionToken] || GENERIC_FALLBACK_LABEL;

  if (actionToken === '에러' || actionToken === '해결') {
    return `${techToken}에서 ${actionLabel} 문제 해결하기`;
  }

  if (actionToken === '구현' || actionToken === '연동') {
    return `${techToken}로 ${actionLabel} 구현하며 정리한 포인트`;
  }

  if (
    actionToken === '최적화' ||
    actionToken === '마이그레이션' ||
    actionToken === '배포' ||
    actionToken === '리팩토링'
  ) {
    return `${techToken}를 적용하면서 겪은 ${actionLabel}와 해결 방법`;
  }

  return `${techToken} 관련 실전 체크리스트`;
}

function buildKeywords(
  techToken: string,
  actionToken: string,
  contexts: MessageContext[],
  technicalRanking: string[],
): string[] {
  const keywords = new Set<string>([techToken, actionToken]);
  const relatedTokens = new Map<string, number>();

  for (const context of contexts) {
    if (!context.techTokens.includes(techToken)) {
      continue;
    }

    for (const token of context.techTokens) {
      if (token !== techToken) {
        relatedTokens.set(token, (relatedTokens.get(token) || 0) + 1);
      }
    }

    for (const phrase of context.phrases) {
      relatedTokens.set(phrase, (relatedTokens.get(phrase) || 0) + 1);
    }
  }

  for (const [token] of [...relatedTokens.entries()].sort(
    (left, right) => right[1] - left[1],
  )) {
    keywords.add(token);
    if (keywords.size >= 6) {
      break;
    }
  }

  for (const token of technicalRanking) {
    if (keywords.size >= 6) {
      break;
    }
    keywords.add(token);
  }

  return [...keywords];
}

function pickEvidenceSnippet(
  contexts: MessageContext[],
  techToken: string,
  actionToken: string,
): string {
  let bestSentence = '';
  let bestScore = -1;

  for (const context of contexts) {
    const joinedSentences =
      context.sentences.length > 0 ? context.sentences : [context.cleanText];

    for (const sentence of joinedSentences) {
      let score = 0;

      if (sentence.toLowerCase().includes(techToken.toLowerCase())) {
        score += 3;
      }
      if (sentence.includes(actionToken)) {
        score += 2;
      }
      if (context.hasProblem) {
        score += 2;
      }
      if (context.hasSolution) {
        score += 1;
      }

      if (score > bestScore) {
        bestSentence = sentence;
        bestScore = score;
      }
    }
  }

  return bestSentence || contexts[0]?.cleanText || '관련 대화에서 핵심 포인트를 추렸습니다.';
}

function inferCategory(tokens: Array<string | undefined>, title: string): string {
  const haystack = [...tokens.filter(Boolean), title].join(' ').toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  return 'tutorial';
}

function stripMarkdownArtifacts(text: string): string {
  return text
    .replace(/`{1,3}/g, ' ')
    .replace(/#{1,6}\s*/g, ' ')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/>\s*/g, ' ')
    .replace(/[-*+]\s+/g, ' ')
    .replace(/\d+\.\s+/g, ' ');
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function sanitizeSourceTitle(title: string): string {
  return normalizeWhitespace(title.replace(/\s*-\s*ChatGPT\s*$/i, ''));
}

function sanitizeGenericLabel(label: string): string {
  return normalizeWhitespace(label).slice(0, 40) || '대화';
}

function normalizeTechToken(token: string): string {
  if (token.endsWith('.tsx') || token.endsWith('.jsx')) {
    return token;
  }

  if (token.endsWith('.ts') || token.endsWith('.js')) {
    return token;
  }

  if (token.startsWith('@')) {
    return token;
  }

  return token;
}

function trimSnippet(snippet: string): string {
  const normalized = normalizeWhitespace(snippet);
  if (normalized.length <= MAX_SNIPPET_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_SNIPPET_LENGTH - 1).trim()}…`;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => normalizeWhitespace(value))
        .filter((value) => value.length >= 2),
    ),
  );
}

function isStopword(word: string): boolean {
  const lower = word.toLowerCase();
  return EN_STOPWORDS.has(lower) || KO_STOPWORDS.has(word);
}

function isTechnicalKeyword(keyword: string): boolean {
  return (
    TECH_PATTERNS.some((pattern) => pattern.label === keyword) ||
    /\.([tj]sx?|json|sql|ya?ml|mdx?)$/i.test(keyword) ||
    keyword.startsWith('@')
  );
}
