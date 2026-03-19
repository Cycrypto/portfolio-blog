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

const MAX_CANDIDATES = 3;
const TARGET_CANDIDATES = 2;
const MAX_SNIPPET_LENGTH = 140;

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
  const technicalRanking = [...technicalStats.entries()].sort(
    (left, right) => scoreTokenStats(right[1]) - scoreTokenStats(left[1]),
  );

  const candidates: ExtractedIdeaCandidate[] = [];
  const seenTitles = new Set<string>();

  for (const [techToken, stats] of technicalRanking) {
    if (candidates.length >= TARGET_CANDIDATES) {
      break;
    }

    const themeCandidate = buildThemeCandidate({
      sourceTitle: sanitizedTitle,
      techToken,
      stats,
      contexts,
    });

    if (!themeCandidate) {
      continue;
    }

    if (seenTitles.has(themeCandidate.title)) {
      continue;
    }

    candidates.push(themeCandidate);
    seenTitles.add(themeCandidate.title);
  }

  if (candidates.length === 0) {
    const genericCandidate = buildGenericThemeCandidate({
      sourceTitle: sanitizedTitle,
      contexts,
      technicalRanking,
    });

    if (genericCandidate) {
      candidates.push(genericCandidate);
      seenTitles.add(genericCandidate.title);
    }
  }

  return candidates
    .map((candidate) => ({
      ...candidate,
      title: trimThemeSentence(candidate.title),
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

function buildThemeCandidate(input: {
  sourceTitle: string;
  techToken: string;
  stats: TokenStats;
  contexts: MessageContext[];
}): ExtractedIdeaCandidate | null {
  const relevantContexts = input.contexts.filter((context) =>
    context.techTokens.includes(input.techToken),
  );

  if (relevantContexts.length === 0) {
    return null;
  }

  const actionCounts = new Map<string, number>();
  const relatedTechCounts = new Map<string, number>();
  const phraseCounts = new Map<string, number>();

  for (const context of relevantContexts) {
    const actionTokens =
      context.actionTokens.length > 0
        ? context.actionTokens
        : context.hasProblem
          ? ['에러']
          : context.hasSolution
            ? ['해결']
            : ['정리'];

    for (const actionToken of actionTokens) {
      actionCounts.set(actionToken, (actionCounts.get(actionToken) || 0) + 1);
    }

    for (const relatedToken of context.techTokens) {
      if (relatedToken === input.techToken) {
        continue;
      }

      relatedTechCounts.set(
        relatedToken,
        (relatedTechCounts.get(relatedToken) || 0) + 1,
      );
    }

    for (const phrase of context.phrases) {
      if (phrase.toLowerCase().includes(input.techToken.toLowerCase())) {
        continue;
      }

      phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
    }
  }

  const dominantAction = pickDominantAction(actionCounts);
  const focusPhrase = pickDominantPhrase(phraseCounts);
  const relatedTechTokens = [...relatedTechCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([token]) => token)
    .slice(0, 2);
  const title = buildThemeSentence(
    input.techToken,
    dominantAction,
    focusPhrase,
    relatedTechTokens,
  );
  const keywords = uniqueStrings(
    [
      input.techToken,
      dominantAction,
      focusPhrase,
      ...relatedTechTokens,
    ].filter(Boolean) as string[],
  ).slice(0, 6);
  const tags = keywords.filter((keyword) => isTechnicalKeyword(keyword)).slice(0, 3);
  const evidenceSnippet = buildThemeReasonSentence({
    techToken: input.techToken,
    dominantAction,
    focusPhrase,
    relatedTechTokens,
    stats: input.stats,
  });

  return {
    title,
    category: inferCategory(
      [input.techToken, focusPhrase, ...relatedTechTokens],
      title,
    ),
    tags: tags.length > 0 ? tags : [input.techToken].slice(0, 3),
    keywords,
    evidenceSnippet,
    score:
      scoreTokenStats(input.stats) +
      relevantContexts.length +
      relatedTechTokens.length +
      (focusPhrase ? 2 : 0),
  };
}

function buildGenericThemeCandidate(input: {
  sourceTitle: string;
  contexts: MessageContext[];
  technicalRanking: Array<[string, TokenStats]>;
}): ExtractedIdeaCandidate | null {
  const topSentence =
    input.contexts.flatMap((context) => context.sentences).find(Boolean) ||
    input.sourceTitle;
  const topTechToken = input.technicalRanking[0]?.[0] || '';
  const focusLabel = sanitizeGenericLabel(topTechToken || topSentence || '대화');
  const title = trimThemeSentence(
    `이 대화는 ${focusLabel}를 중심으로 정리하는 흐름이다.`,
  );

  if (!title) {
    return null;
  }

  return {
    title,
    category: inferCategory([topTechToken], title),
    tags: topTechToken ? [topTechToken] : [],
    keywords: uniqueStrings([topTechToken, focusLabel]).slice(0, 4),
    evidenceSnippet: trimSnippet(
      topSentence
        ? `${sanitizeGenericLabel(topSentence)}가 대화 전반의 핵심 흐름으로 이어졌다.`
        : '대화 전반에서 같은 주제가 반복적으로 등장했다.',
    ),
    score: 1,
  };
}

function pickDominantAction(actionCounts: Map<string, number>): string {
  return [...actionCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return ACTION_PATTERNS.findIndex((item) => item.label === left[0]) -
        ACTION_PATTERNS.findIndex((item) => item.label === right[0]);
    })
    .map(([actionToken]) => actionToken)[0] || '정리';
}

function pickDominantPhrase(phraseCounts: Map<string, number>): string {
  return [...phraseCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return right[0].length - left[0].length;
    })
    .map(([phrase]) => phrase)
    .find((phrase) => phrase.length >= 4 && phrase.length <= 30) || '';
}

function buildThemeSentence(
  techToken: string,
  dominantAction: string,
  focusPhrase: string,
  relatedTechTokens: string[],
): string {
  const scope = buildThemeScope(techToken, focusPhrase, relatedTechTokens);

  if (dominantAction === '에러' || dominantAction === '해결') {
    return trimThemeSentence(
      `이 대화는 ${scope} 문제를 분석하고 해결 방향을 정리하는 흐름이다.`,
    );
  }

  if (dominantAction === '구현' || dominantAction === '연동') {
    return trimThemeSentence(
      `이 대화는 ${scope} 구현 방향을 정리하는 흐름이다.`,
    );
  }

  if (
    dominantAction === '배포' ||
    dominantAction === '최적화' ||
    dominantAction === '마이그레이션' ||
    dominantAction === '리팩토링'
  ) {
    return trimThemeSentence(
      `이 대화는 ${scope} ${dominantAction} 과정을 점검하는 내용이다.`,
    );
  }

  return trimThemeSentence(
    `이 대화는 ${scope}를 중심으로 정리하는 흐름이다.`,
  );
}

function buildThemeScope(
  techToken: string,
  focusPhrase: string,
  relatedTechTokens: string[],
): string {
  const trimmedFocusPhrase = sanitizeGenericLabel(focusPhrase);
  if (trimmedFocusPhrase) {
    return trimmedFocusPhrase
      .toLowerCase()
      .includes(techToken.toLowerCase())
      ? trimmedFocusPhrase
      : `${techToken} ${trimmedFocusPhrase}`;
  }

  if (relatedTechTokens.length > 0) {
    return `${techToken}와 ${relatedTechTokens.join(', ')}`;
  }

  return techToken;
}

function buildThemeReasonSentence(input: {
  techToken: string;
  dominantAction: string;
  focusPhrase: string;
  relatedTechTokens: string[];
  stats: TokenStats;
}): string {
  const reasonTokens = uniqueStrings(
    [
      input.techToken,
      input.focusPhrase,
      ...input.relatedTechTokens,
    ].filter(Boolean) as string[],
  ).slice(0, 3);
  const reasonSubject =
    reasonTokens.join(', ') || sanitizeGenericLabel(input.techToken || '핵심 주제');
  const roleHint =
    input.stats.roles.has('user') && input.stats.roles.has('assistant')
      ? 'user와 assistant 양쪽에서'
      : '대화 전반에서';

  if (input.stats.problemTurns.size > 0 && input.stats.solutionTurns.size > 0) {
    return trimSnippet(
      `${reasonSubject}가 ${roleHint} 반복되고 문제와 해결 흐름이 함께 이어졌다.`,
    );
  }

  if (input.dominantAction === '구현' || input.dominantAction === '연동') {
    return trimSnippet(
      `${reasonSubject}가 ${roleHint} 반복되며 구현 논점이 구체화됐다.`,
    );
  }

  return trimSnippet(
    `${reasonSubject}가 ${roleHint} 반복적으로 등장했다.`,
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

function trimThemeSentence(sentence: string): string {
  const normalized = normalizeWhitespace(sentence)
    .replace(/\s+/g, ' ')
    .replace(/[.。]+$/u, '');

  if (!normalized) {
    return '';
  }

  return trimSnippet(`${normalized}.`);
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
