const ALLOWED_CATEGORIES = [
  'frontend',
  'backend',
  'devops',
  'cloud',
  'database',
  'tutorial',
];

const MAX_CHUNK_TURNS = 10;
const MIN_CHUNK_CHARS = 200;
const MAX_ROLLING_SUMMARY_CHARS = 1200;
const MAX_SALIENT_TURN_TEXT_CHARS = 420;
const MAX_MEMORY_TRANSCRIPT_CHARS = 4000;
const MAX_REDUCED_MESSAGE_CHARS = 1400;
const TARGET_THEME_CANDIDATES = 2;
const MAX_THEME_CANDIDATES = 3;

const TECHNICAL_PATTERN =
  /```|`[^`]+`|[A-Za-z_][A-Za-z0-9_./-]*\([^)]*\)|[A-Za-z0-9_./-]+\.[A-Za-z0-9_-]+|next\.js|react|nestjs|typeorm|postgres|docker|redis|api|cache|auth|cloud/i;
const PROBLEM_PATTERN =
  /error|failed|failure|bug|issue|stale|cache miss|timeout|unexpected|문제|오류|에러|실패|안됨|버그/i;
const SOLUTION_PATTERN =
  /fix|fixed|resolved|changed|added|implemented|migrated|optimized|configured|해결|수정|적용|구현|개선|정리/i;

const STOP_WORDS = new Set([
  'the',
  'and',
  'that',
  'this',
  'with',
  'from',
  'into',
  'about',
  'there',
  'their',
  'what',
  'when',
  'where',
  'which',
  'have',
  'has',
  'had',
  'were',
  'been',
  'while',
  'then',
  'just',
  'your',
  'will',
  'would',
  'should',
  'could',
  'into',
  'than',
  'after',
  'before',
  'because',
  'through',
  'using',
  'used',
  'need',
  'needs',
  'make',
  'made',
  'like',
  'only',
  'more',
  'most',
  'some',
  'very',
  'hello',
  '안녕',
  '안녕하세요',
  '무엇',
  '필요',
  '입니다',
  '있는',
  '없는',
  '하는',
  '다음',
  '지금',
  '관련',
  '정도',
  '그냥',
  '대한',
  '그리고',
  '그런',
  '에서',
  '으로',
  '까지',
]);

async function createImportAnalysis({ body, oauthClient, config }) {
  const preparedTranscript = prepareMessagesForImport(body.messages, config);

  if (preparedTranscript.messages.length === 0) {
    throw new Error('No usable conversation turns were provided.');
  }

  const chunkAnalysis = await summarizeConversationWithRetry({
    sourceTitle: body.sourceTitle,
    sourceUrl: body.sourceUrl,
    messages: preparedTranscript.messages,
    oauthClient,
    config,
  });

  const memory = buildConversationMemory({
    sourceTitle: body.sourceTitle,
    sourceUrl: body.sourceUrl,
    selectedMessages: preparedTranscript.messages,
    chunkAnalysis,
    stats: preparedTranscript.stats,
    config,
  });

  let response;

  try {
    response = await createFinalIdeaAnalysis({
      sourceTitle: body.sourceTitle,
      sourceUrl: body.sourceUrl,
      memory,
      oauthClient,
      config,
    });
  } catch (error) {
    throw wrapStageError('final-idea failed', error);
  }

  return {
    summary: normalizeSummary(response, memory),
    candidates: normalizeCandidates(response.candidates || [], response, memory),
    memory,
  };
}

function createStarterMessage(context) {
  const focus = context.summaryShort || context.evidenceSnippet || context.title;
  return `${context.title} 글감을 기준으로 글을 확장해봅시다. 우선 ${focus} 중에서 어떤 독자와 문제 상황을 가장 강조하고 싶은지 정해볼까요?`;
}

async function createSessionReply({ message, oauthClient, session, rawConversation }) {
  const response = await oauthClient.completeJson({
    systemPrompt: [
      'You are a Korean writing assistant for a personal engineering blog.',
      'Return strict JSON only with reply, suggestions, continuationBrief, sessionSummary.',
      'Keep the tone practical and concise.',
      'Help the author refine angle, structure, examples, and what to omit.',
    ].join(' '),
    userPrompt: JSON.stringify(
      {
        context: buildContext(session.context, rawConversation),
        conversation: [...session.messages, { role: 'user', content: message }]
          .slice(-12),
        schema: {
          reply: 'string',
          suggestions: ['string'],
          continuationBrief: 'string',
          sessionSummary: 'string',
        },
      },
    ),
  });

  return {
    reply: String(response.reply || '').trim(),
    suggestions: Array.isArray(response.suggestions)
      ? response.suggestions.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
      : [],
    continuationBrief: String(
      response.continuationBrief || session.context.continuationBrief || '',
    ).trim(),
    sessionSummary: String(response.sessionSummary || session.summary || '').trim(),
  };
}

async function createDraftFromContext({ context, oauthClient, rawConversation, session }) {
  const response = await oauthClient.completeJson({
    systemPrompt: [
      'You are a Korean engineering blog ghostwriter.',
      'Return strict JSON only with title, category, tags, markdown.',
      'Write a complete Markdown draft with clear headings, practical details, and a concise conclusion.',
      'Category must be one of frontend, backend, devops, cloud, database, tutorial.',
      'Do not fabricate details beyond the provided context.',
    ].join(' '),
    userPrompt: JSON.stringify(
      {
        targetLength: context.targetLength || 'medium',
        context: buildContext(context, rawConversation),
        sessionMessages: session ? session.messages.slice(-12) : [],
        schema: {
          title: 'string',
          category: 'frontend|backend|devops|cloud|database|tutorial',
          tags: ['string'],
          markdown: 'string',
        },
      },
    ),
  });

  return {
    title: String(response.title || context.title || '').trim(),
    category: normalizeCategory(response.category || context.category),
    tags: Array.isArray(response.tags)
      ? response.tags.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
      : context.tags || [],
    markdown: String(response.markdown || '').trim(),
  };
}

async function summarizeConversationWithRetry(input) {
  const initialChunkChars = Math.max(
    MIN_CHUNK_CHARS,
    Number(input.config.importChunkChars) || MIN_CHUNK_CHARS,
  );

  try {
    return await summarizeConversationChunks({
      ...input,
      chunkChars: initialChunkChars,
      retried: false,
    });
  } catch (error) {
    const smallerChunkChars = Math.max(
      MIN_CHUNK_CHARS,
      Math.floor(initialChunkChars / 2),
    );

    if (
      input.messages.length < 2 ||
      smallerChunkChars >= initialChunkChars
    ) {
      throw wrapStageError('chunk-summary failed', error);
    }

    try {
      return await summarizeConversationChunks({
        ...input,
        chunkChars: smallerChunkChars,
        retried: true,
      });
    } catch (retryError) {
      throw wrapStageError('chunk-summary failed', retryError);
    }
  }
}

async function summarizeConversationChunks({
  sourceTitle,
  sourceUrl,
  messages,
  oauthClient,
  config,
  chunkChars,
  retried,
}) {
  const chunks = chunkMessages(messages, chunkChars, MAX_CHUNK_TURNS);
  const results = [];
  let rollingSummary = '';

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const response = await oauthClient.completeJson({
      systemPrompt: [
        'You are summarizing one chunk of a longer ChatGPT conversation for a personal engineering blog.',
        'Return strict JSON only.',
        'Focus on technical topics, decisions, open questions, evidence snippets, and which turn orders matter most.',
      ].join(' '),
      userPrompt: JSON.stringify(
        {
          sourceTitle,
          sourceUrl,
          chunkIndex: index + 1,
          totalChunks: chunks.length,
          rollingSummary,
          transcript: formatTranscript(chunk),
          schema: {
            summaryShort: 'string',
            keyPoints: ['string'],
            technicalTopics: ['string'],
            decisions: ['string'],
            openQuestions: ['string'],
            evidenceSnippets: ['string'],
            candidateTurnOrders: [0],
          },
        },
      ),
    });

    const normalized = normalizeChunkSummary(response, chunk, index + 1);
    results.push(normalized);
    rollingSummary = buildRollingSummaryText(results);
  }

  return {
    chunkSummaries: results,
    chunkChars,
    retriedWithSmallerChunks: retried,
  };
}

async function createFinalIdeaAnalysis({
  sourceTitle,
  sourceUrl,
  memory,
  oauthClient,
  config,
}) {
  const finalPayload = fitFinalPromptPayload(
    {
      sourceTitle,
      sourceUrl,
      conversationMemory: {
        summaryShort: memory.rollingSummary.summaryShort,
        summaryLong: memory.rollingSummary.summaryLong,
        keyPoints: memory.rollingSummary.keyPoints,
        technicalTopics: memory.rollingSummary.technicalTopics,
        decisions: memory.rollingSummary.decisions,
        openQuestions: memory.rollingSummary.openQuestions,
        evidenceSnippets: memory.rollingSummary.evidenceSnippets,
        salientTurns: memory.salientTurns.map((turn) => ({
          order: turn.order,
          role: turn.role,
          text: turn.text,
          reasons: turn.reasons,
        })),
        reducedTranscriptStats: memory.reducedTranscriptStats,
      },
      schema: {
        summaryShort: 'string',
        summaryLong: 'string',
        keyPoints: ['string'],
        technicalTopics: ['string'],
        decisions: ['string'],
        openQuestions: ['string'],
        evidenceSnippets: ['string'],
        continuationBrief: 'string',
        candidates: [
          {
            title: 'string',
            category: 'frontend|backend|devops|cloud|database|tutorial',
            tags: ['string'],
            keywords: ['string'],
            evidenceSnippet: 'string',
            score: 1,
            continuationBrief: 'string',
            sourceMessageRefs: [0],
          },
        ],
      },
    },
    config.importMaxFinalPromptChars,
  );

  return oauthClient.completeJson({
    systemPrompt: [
      'You are a conversation theme extraction agent for a personal engineering blog.',
      'You are given reduced conversation memory, not a full transcript.',
      'Return strict JSON only.',
      'Summarize the conversation with one conversation-wide theme sentence.',
      'Propose 2 or 3 conversation-wide themes, not blog titles.',
      'Each candidate title must be one Korean sentence that starts with "이 대화는".',
      'Each candidate title must describe the overall conversation theme, not a post headline.',
      'Avoid title-like phrasing such as 체크리스트, 해결하기, 가이드, 방법, 포인트, 법.',
      'Category must be one of frontend, backend, devops, cloud, database, tutorial.',
      'Each candidate must include title, category, tags, keywords, evidenceSnippet, score, continuationBrief, sourceMessageRefs.',
      'evidenceSnippet must be one short sentence explaining why this theme fits the whole conversation.',
      'sourceMessageRefs must reference the provided salient turn orders.',
    ].join(' '),
    userPrompt: JSON.stringify(finalPayload),
  });
}

function buildConversationMemory({
  sourceTitle,
  sourceUrl,
  selectedMessages,
  chunkAnalysis,
  stats,
  config,
}) {
  const rollingSummary = aggregateChunkSummaries(
    chunkAnalysis.chunkSummaries,
    sourceTitle,
  );
  const scoredTurns = scoreSalientTurns(
    selectedMessages,
    chunkAnalysis.chunkSummaries,
    sourceTitle,
  );
  const salientTurns = scoredTurns
    .slice(0, config.importMaxSalientTurns)
    .sort((left, right) => left.order - right.order)
    .map((turn) => ({
      order: turn.order,
      role: turn.role,
      text: trimText(turn.text, MAX_SALIENT_TURN_TEXT_CHARS),
      score: turn.score,
      reasons: turn.reasons.slice(0, 4),
    }));

  return {
    sourceTitle,
    sourceUrl,
    chunkSummaries: chunkAnalysis.chunkSummaries,
    rollingSummary,
    salientTurns,
    reducedTranscriptStats: {
      ...stats,
      chunkCount: chunkAnalysis.chunkSummaries.length,
      chunkCharBudget: chunkAnalysis.chunkChars,
      retriedWithSmallerChunks: chunkAnalysis.retriedWithSmallerChunks,
    },
  };
}

function buildContext(context, rawConversation) {
  const memory = rawConversation?.memory || null;
  const rollingSummary = memory?.rollingSummary || {};
  const salientTurns = sanitizeSalientTurns(memory?.salientTurns || []);

  return {
    sourceTitle: context.sourceTitle,
    sourceUrl: context.sourceUrl,
    title: context.title,
    category: context.category,
    tags: context.tags || [],
    keywords: context.keywords || [],
    summaryShort: context.summaryShort || rollingSummary.summaryShort || '',
    summaryLong: context.summaryLong || rollingSummary.summaryLong || '',
    keyPoints: uniqueList([
      ...(context.keyPoints || []),
      ...(rollingSummary.keyPoints || []),
    ]).slice(0, 8),
    technicalTopics: uniqueList([
      ...(context.technicalTopics || []),
      ...(rollingSummary.technicalTopics || []),
    ]).slice(0, 10),
    decisions: uniqueList([
      ...(context.decisions || []),
      ...(rollingSummary.decisions || []),
    ]).slice(0, 6),
    openQuestions: uniqueList([
      ...(context.openQuestions || []),
      ...(rollingSummary.openQuestions || []),
    ]).slice(0, 6),
    evidenceSnippets: uniqueList([
      ...(context.evidenceSnippets || []),
      ...(rollingSummary.evidenceSnippets || []),
    ]).slice(0, 8),
    continuationBrief: context.continuationBrief || '',
    salientTurns,
    chunkSummaries: Array.isArray(memory?.chunkSummaries)
      ? memory.chunkSummaries.slice(0, 4).map((chunk) => ({
          chunkIndex: chunk.chunkIndex,
          summaryShort: chunk.summaryShort,
          keyPoints: chunk.keyPoints,
          technicalTopics: chunk.technicalTopics,
        }))
      : [],
    reducedTranscriptStats: memory?.reducedTranscriptStats || null,
    rawTranscriptExcerpt: buildSalientTranscriptExcerpt(
      salientTurns,
      rawConversation?.messages || [],
    ),
  };
}

function prepareMessagesForImport(messages, config) {
  const sanitizedMessages = (messages || [])
    .map((message, index) => ({
      order: Number.isInteger(message?.order) ? message.order : index,
      role: sanitizeRole(message?.role),
      text: trimText(String(message?.text || '').trim(), MAX_REDUCED_MESSAGE_CHARS),
    }))
    .filter((message) => message.text.length > 0);

  const originalChars = sanitizedMessages.reduce(
    (total, message) => total + estimateTurnSize(message),
    0,
  );

  if (originalChars <= config.importMaxChars) {
    return {
      messages: sanitizedMessages,
      stats: {
        originalTurns: sanitizedMessages.length,
        originalChars,
        selectedTurns: sanitizedMessages.length,
        selectedChars: originalChars,
      },
    };
  }

  const selectedMessages = reduceMessagesToBudget(
    sanitizedMessages,
    config.importMaxChars,
  );
  const selectedChars = selectedMessages.reduce(
    (total, message) => total + estimateTurnSize(message),
    0,
  );

  return {
    messages: selectedMessages,
    stats: {
      originalTurns: sanitizedMessages.length,
      originalChars,
      selectedTurns: selectedMessages.length,
      selectedChars,
    },
  };
}

function reduceMessagesToBudget(messages, maxChars) {
  const indexedMessages = messages.map((message, index) => ({
    ...message,
    _index: index,
  }));
  const scores = scoreMessagesForSelection(messages, '');
  const keepIndexes = new Set();

  for (const message of indexedMessages.slice(0, 3)) {
    keepIndexes.add(message._index);
  }

  for (const message of indexedMessages.slice(-8)) {
    keepIndexes.add(message._index);
  }

  let usedChars = sumSelectedChars(indexedMessages, keepIndexes);

  const sortedCandidates = indexedMessages
    .filter((message) => !keepIndexes.has(message._index))
    .sort((left, right) => {
      const scoreDiff =
        (scores.get(right.order)?.score || 0) - (scores.get(left.order)?.score || 0);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }

      return left._index - right._index;
    });

  for (const message of sortedCandidates) {
    const nextSize = estimateTurnSize(message);
    if (usedChars + nextSize > maxChars) {
      continue;
    }

    keepIndexes.add(message._index);
    usedChars += nextSize;
  }

  return indexedMessages
    .filter((message) => keepIndexes.has(message._index))
    .sort((left, right) => left._index - right._index)
    .map(({ _index, ...message }) => message);
}

function scoreMessagesForSelection(messages, sourceTitle) {
  const repeatedTerms = buildRepeatedTermMap(messages, sourceTitle);
  return new Map(
    messages.map((message) => {
      const score = calculateTurnScore(message, repeatedTerms, sourceTitle, new Set());
      return [message.order, score];
    }),
  );
}

function chunkMessages(messages, chunkChars, maxTurnsPerChunk) {
  const chunks = [];
  let currentChunk = [];
  let currentChars = 0;

  for (const message of messages) {
    const messageSize = estimateTurnSize(message);
    const exceedsChunk =
      currentChunk.length > 0 &&
      (currentChars + messageSize > chunkChars ||
        currentChunk.length >= maxTurnsPerChunk);

    if (exceedsChunk) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChars = 0;
    }

    currentChunk.push(message);
    currentChars += messageSize;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function normalizeChunkSummary(response, chunk, chunkIndex) {
  const allowedOrders = new Set(chunk.map((message) => message.order));

  return {
    chunkIndex,
    turnOrders: chunk.map((message) => message.order),
    summaryShort: trimText(String(response.summaryShort || ''), 260),
    keyPoints: sanitizeList(response.keyPoints, 5),
    technicalTopics: sanitizeList(response.technicalTopics, 6),
    decisions: sanitizeList(response.decisions, 4),
    openQuestions: sanitizeList(response.openQuestions, 4),
    evidenceSnippets: sanitizeList(response.evidenceSnippets, 4),
    candidateTurnOrders: Array.isArray(response.candidateTurnOrders)
      ? response.candidateTurnOrders
          .filter((value) => Number.isInteger(value) && allowedOrders.has(value))
          .slice(0, 6)
      : [],
  };
}

function buildRollingSummaryText(chunkSummaries) {
  const recentSummaries = chunkSummaries.slice(-4);
  const rolling = aggregateChunkSummaries(recentSummaries, '');

  return trimText(
    [
      rolling.summaryShort,
      rolling.keyPoints.length > 0
        ? `Key points: ${rolling.keyPoints.join(' / ')}`
        : '',
      rolling.technicalTopics.length > 0
        ? `Technical topics: ${rolling.technicalTopics.join(', ')}`
        : '',
      rolling.openQuestions.length > 0
        ? `Open questions: ${rolling.openQuestions.join(' / ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    MAX_ROLLING_SUMMARY_CHARS,
  );
}

function aggregateChunkSummaries(chunkSummaries, sourceTitle) {
  const summaryShort =
    trimText(
      chunkSummaries.map((chunk) => chunk.summaryShort).find(Boolean) || sourceTitle || '',
      200,
    ) || '';

  const keyPoints = uniqueList(
    chunkSummaries.flatMap((chunk) => chunk.keyPoints || []),
  ).slice(0, 8);
  const technicalTopics = uniqueList(
    chunkSummaries.flatMap((chunk) => chunk.technicalTopics || []),
  ).slice(0, 10);
  const decisions = uniqueList(
    chunkSummaries.flatMap((chunk) => chunk.decisions || []),
  ).slice(0, 6);
  const openQuestions = uniqueList(
    chunkSummaries.flatMap((chunk) => chunk.openQuestions || []),
  ).slice(0, 6);
  const evidenceSnippets = uniqueList(
    chunkSummaries.flatMap((chunk) => chunk.evidenceSnippets || []),
  ).slice(0, 6);

  return {
    summaryShort,
    summaryLong: trimText(
      [
        summaryShort,
        keyPoints.length > 0 ? `핵심 포인트: ${keyPoints.join(' / ')}` : '',
        technicalTopics.length > 0
          ? `기술 주제: ${technicalTopics.join(', ')}`
          : '',
        decisions.length > 0 ? `결정: ${decisions.join(' / ')}` : '',
        openQuestions.length > 0
          ? `남은 질문: ${openQuestions.join(' / ')}`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
      2000,
    ),
    keyPoints,
    technicalTopics,
    decisions,
    openQuestions,
    evidenceSnippets,
  };
}

function scoreSalientTurns(messages, chunkSummaries, sourceTitle) {
  const candidateTurnOrders = new Set(
    chunkSummaries.flatMap((chunk) => chunk.candidateTurnOrders || []),
  );
  const repeatedTerms = buildRepeatedTermMap(messages, sourceTitle);

  return messages
    .map((message) => ({
      order: message.order,
      role: message.role,
      text: message.text,
      ...calculateTurnScore(
        message,
        repeatedTerms,
        sourceTitle,
        candidateTurnOrders,
      ),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.order - left.order;
    });
}

function calculateTurnScore(message, repeatedTerms, sourceTitle, candidateTurnOrders) {
  let score = 0;
  const reasons = [];
  const text = message.text;

  if (candidateTurnOrders.has(message.order)) {
    score += 5;
    reasons.push('chunk-candidate');
  }

  if (TECHNICAL_PATTERN.test(text)) {
    score += 3;
    reasons.push('technical');
  }

  if (PROBLEM_PATTERN.test(text)) {
    score += 3;
    reasons.push('problem');
  }

  if (SOLUTION_PATTERN.test(text)) {
    score += 2;
    reasons.push('solution');
  }

  const repeatedTermMatches = extractTerms(text).filter(
    (term) => (repeatedTerms.get(term) || 0) > 1,
  );
  if (repeatedTermMatches.length > 0) {
    score += Math.min(repeatedTermMatches.length, 3);
    reasons.push('repeated-topic');
  }

  if (
    sourceTitle &&
    extractTerms(sourceTitle).some((term) =>
      extractTerms(text).includes(term),
    )
  ) {
    score += 2;
    reasons.push('title-match');
  }

  if (text.length >= 220) {
    score += 1;
    reasons.push('long-detail');
  }

  if (message.role === 'user') {
    score += 1;
    reasons.push('user-problem');
  }

  return {
    score,
    reasons,
  };
}

function buildRepeatedTermMap(messages, sourceTitle) {
  const repeatedTerms = new Map();
  const inputs = sourceTitle ? [...messages, { text: sourceTitle }] : messages;

  for (const message of inputs) {
    const uniqueTerms = new Set(extractTerms(message.text || ''));
    for (const term of uniqueTerms) {
      repeatedTerms.set(term, (repeatedTerms.get(term) || 0) + 1);
    }
  }

  return repeatedTerms;
}

function fitFinalPromptPayload(payload, maxChars) {
  const nextPayload = JSON.parse(JSON.stringify(payload));
  let serialized = JSON.stringify(nextPayload);

  if (serialized.length <= maxChars) {
    return nextPayload;
  }

  nextPayload.conversationMemory.summaryLong = trimText(
    nextPayload.conversationMemory.summaryLong || '',
    800,
  );
  serialized = JSON.stringify(nextPayload);

  if (serialized.length <= maxChars) {
    return nextPayload;
  }

  nextPayload.conversationMemory.keyPoints =
    nextPayload.conversationMemory.keyPoints.slice(0, 5);
  nextPayload.conversationMemory.technicalTopics =
    nextPayload.conversationMemory.technicalTopics.slice(0, 6);
  nextPayload.conversationMemory.decisions =
    nextPayload.conversationMemory.decisions.slice(0, 3);
  nextPayload.conversationMemory.openQuestions =
    nextPayload.conversationMemory.openQuestions.slice(0, 3);
  nextPayload.conversationMemory.evidenceSnippets =
    nextPayload.conversationMemory.evidenceSnippets.slice(0, 3);
  serialized = JSON.stringify(nextPayload);

  if (serialized.length <= maxChars) {
    return nextPayload;
  }

  nextPayload.conversationMemory.salientTurns =
    nextPayload.conversationMemory.salientTurns
      .slice(0, 6)
      .map((turn) => ({
        ...turn,
        text: trimText(turn.text, 180),
        reasons: (turn.reasons || []).slice(0, 3),
      }));
  serialized = JSON.stringify(nextPayload);

  if (serialized.length <= maxChars) {
    return nextPayload;
  }

  nextPayload.conversationMemory.salientTurns =
    nextPayload.conversationMemory.salientTurns
      .slice(0, 4)
      .map((turn) => ({
        ...turn,
        text: trimText(turn.text, 100),
        reasons: (turn.reasons || []).slice(0, 2),
      }));
  serialized = JSON.stringify(nextPayload);

  if (serialized.length <= maxChars) {
    return nextPayload;
  }

  nextPayload.conversationMemory.summaryShort = trimText(
    nextPayload.conversationMemory.summaryShort || '',
    120,
  );
  nextPayload.conversationMemory.summaryLong = trimText(
    nextPayload.conversationMemory.summaryLong || '',
    320,
  );
  nextPayload.conversationMemory.keyPoints =
    nextPayload.conversationMemory.keyPoints.slice(0, 3);
  nextPayload.conversationMemory.technicalTopics =
    nextPayload.conversationMemory.technicalTopics.slice(0, 4);
  nextPayload.conversationMemory.decisions =
    nextPayload.conversationMemory.decisions.slice(0, 2);
  nextPayload.conversationMemory.openQuestions =
    nextPayload.conversationMemory.openQuestions.slice(0, 2);
  nextPayload.conversationMemory.evidenceSnippets =
    nextPayload.conversationMemory.evidenceSnippets.slice(0, 2);
  nextPayload.conversationMemory.salientTurns =
    nextPayload.conversationMemory.salientTurns
      .slice(0, 3)
      .map((turn) => ({
        order: turn.order,
        role: turn.role,
        text: trimText(turn.text, 80),
      }));
  serialized = JSON.stringify(nextPayload);

  if (serialized.length <= maxChars) {
    return nextPayload;
  }

  nextPayload.conversationMemory.reducedTranscriptStats = {
    originalTurns: nextPayload.conversationMemory.reducedTranscriptStats?.originalTurns || 0,
    selectedTurns: nextPayload.conversationMemory.reducedTranscriptStats?.selectedTurns || 0,
    retriedWithSmallerChunks:
      nextPayload.conversationMemory.reducedTranscriptStats?.retriedWithSmallerChunks || false,
  };
  serialized = JSON.stringify(nextPayload);

  if (serialized.length <= maxChars) {
    return nextPayload;
  }

  nextPayload.conversationMemory.salientTurns =
    nextPayload.conversationMemory.salientTurns
      .slice(0, 2)
      .map((turn) => ({
        order: turn.order,
        role: turn.role,
        text: trimText(turn.text, 56),
      }));
  nextPayload.conversationMemory.keyPoints =
    nextPayload.conversationMemory.keyPoints.slice(0, 2);
  nextPayload.conversationMemory.technicalTopics =
    nextPayload.conversationMemory.technicalTopics.slice(0, 3);
  nextPayload.conversationMemory.evidenceSnippets =
    nextPayload.conversationMemory.evidenceSnippets.slice(0, 1);

  return nextPayload;
}

function sanitizeSalientTurns(salientTurns) {
  return (salientTurns || [])
    .filter((turn) => Number.isInteger(turn?.order) && typeof turn?.text === 'string')
    .slice(0, 8)
    .map((turn) => ({
      order: turn.order,
      role: sanitizeRole(turn.role),
      text: trimText(turn.text, MAX_SALIENT_TURN_TEXT_CHARS),
      reasons: Array.isArray(turn.reasons)
        ? turn.reasons.map((reason) => String(reason).trim()).filter(Boolean).slice(0, 4)
        : [],
    }));
}

function buildSalientTranscriptExcerpt(salientTurns, rawMessages) {
  if (salientTurns.length > 0) {
    return trimText(
      formatTranscript(
        salientTurns.map((turn) => ({
          order: turn.order,
          role: turn.role,
          text: turn.text,
        })),
      ),
      MAX_MEMORY_TRANSCRIPT_CHARS,
    );
  }

  return rawMessages.length > 0
    ? trimText(
        formatTranscript(rawMessages.slice(-6)),
        MAX_MEMORY_TRANSCRIPT_CHARS,
      )
    : '';
}

function normalizeSummary(response, memory) {
  const rollingSummary = memory?.rollingSummary || {};
  const fallbackThemeSentence = buildThemeSentenceFromParts({
    raw: rollingSummary.summaryShort || '',
    keywords: rollingSummary.technicalTopics || [],
    fallbackReason: rollingSummary.evidenceSnippets?.[0] || '',
    maxLength: 180,
  });

  return {
    summaryShort: buildThemeSentenceFromParts({
      raw: String(response.summaryShort || rollingSummary.summaryShort || ''),
      keywords: rollingSummary.technicalTopics || [],
      fallbackReason: rollingSummary.evidenceSnippets?.[0] || '',
      maxLength: 180,
    }),
    summaryLong: trimText(
      String(
        response.summaryLong ||
          response.summaryShort ||
          rollingSummary.summaryLong ||
          '',
      ),
      2000,
    ),
    keyPoints: sanitizeList(
      response.keyPoints || rollingSummary.keyPoints || [],
      6,
    ),
    technicalTopics: sanitizeList(
      response.technicalTopics || rollingSummary.technicalTopics || [],
      8,
    ),
    decisions: sanitizeList(
      response.decisions || rollingSummary.decisions || [],
      4,
    ),
    openQuestions: sanitizeList(
      response.openQuestions || rollingSummary.openQuestions || [],
      4,
    ),
    evidenceSnippets: sanitizeList(
      response.evidenceSnippets || rollingSummary.evidenceSnippets || [],
      5,
    ),
    continuationBrief: trimText(
      String(response.continuationBrief || fallbackThemeSentence),
      2000,
    ),
  };
}

function normalizeCandidates(candidates, response, memory) {
  const fallbackSummary =
    response.summaryShort || memory?.rollingSummary?.summaryShort || '';
  const fallbackKeywords = memory?.rollingSummary?.technicalTopics || [];
  const normalizedCandidates = candidates
    .map((candidate) => {
      const keywords = sanitizeList(candidate.keywords, 8);
      const tags = sanitizeList(candidate.tags, 5);
      const title = buildThemeSentenceFromParts({
        raw: String(candidate.title || ''),
        keywords: [...tags, ...keywords, ...fallbackKeywords],
        fallbackReason: String(candidate.evidenceSnippet || fallbackSummary),
        maxLength: 120,
      });

      return {
        title,
        category: normalizeCategory(candidate.category),
        tags,
        keywords,
        evidenceSnippet: buildThemeReasonSentence({
          raw: String(candidate.evidenceSnippet || ''),
          title,
          keywords,
          fallbackReason: fallbackSummary,
        }),
        score: Number.isFinite(candidate.score) ? candidate.score : 1,
        continuationBrief: trimText(
          String(candidate.continuationBrief || response.continuationBrief || title),
          1200,
        ),
        sourceMessageRefs: Array.isArray(candidate.sourceMessageRefs)
          ? candidate.sourceMessageRefs
              .filter((value) => Number.isInteger(value) && value >= 0)
              .slice(0, 8)
          : [],
      };
    })
    .filter((candidate) => candidate.title.length > 0)
    .slice(0, MAX_THEME_CANDIDATES);

  if (normalizedCandidates.length > 0) {
    return normalizedCandidates;
  }

  const synthesizedTitle = buildThemeSentenceFromParts({
    raw: fallbackSummary,
    keywords: fallbackKeywords,
    fallbackReason: memory?.rollingSummary?.evidenceSnippets?.[0] || '',
    maxLength: 120,
  });

  if (!synthesizedTitle) {
    return [];
  }

  return [
    {
      title: synthesizedTitle,
      category: normalizeCategory(memory?.rollingSummary?.technicalTopics?.[0] || 'tutorial'),
      tags: sanitizeList(memory?.rollingSummary?.technicalTopics || [], 3),
      keywords: sanitizeList(
        [
          ...(memory?.rollingSummary?.technicalTopics || []),
          ...(memory?.rollingSummary?.keyPoints || []),
        ],
        6,
      ),
      evidenceSnippet: buildThemeReasonSentence({
        raw: memory?.rollingSummary?.evidenceSnippets?.[0] || '',
        title: synthesizedTitle,
        keywords: memory?.rollingSummary?.technicalTopics || [],
        fallbackReason: fallbackSummary,
      }),
      score: 1,
      continuationBrief: trimText(String(response.continuationBrief || synthesizedTitle), 1200),
      sourceMessageRefs: [],
    },
  ];
}

function buildThemeSentenceFromParts({
  raw,
  keywords,
  fallbackReason,
  maxLength,
}) {
  const themeCore = sanitizeThemeCore(raw);
  const fallbackCore =
    sanitizeThemeCore(fallbackReason) ||
    uniqueList(keywords || []).slice(0, 3).join(' ');
  const subject = trimText(themeCore || fallbackCore || '핵심 주제', 72);
  const sentence = subject.startsWith('이 대화는')
    ? subject
    : `이 대화는 ${subject} 중심으로 정리하는 흐름이다.`;

  return trimText(ensureSentenceEnding(sentence), maxLength);
}

function buildThemeReasonSentence({
  raw,
  title,
  keywords,
  fallbackReason,
}) {
  const cleanedRaw = trimText(
    String(raw || '')
      .replace(/\s+/g, ' ')
      .replace(/^이 대화는\s*/u, '')
      .trim(),
    140,
  );

  if (cleanedRaw.length >= 12 && !/체크리스트|해결하기|가이드|방법/u.test(cleanedRaw)) {
    return ensureSentenceEnding(cleanedRaw);
  }

  const reasonKeywords = uniqueList([
    ...sanitizeList(keywords || [], 8),
    sanitizeThemeCore(title),
    sanitizeThemeCore(fallbackReason || ''),
  ])
    .filter(Boolean)
    .slice(0, 3);

  if (reasonKeywords.length === 0) {
    return '대화 전반에서 같은 주제가 반복적으로 등장했다.';
  }

  return ensureSentenceEnding(
    `${reasonKeywords.join(', ')}가 대화 전반에 반복적으로 등장했다`,
  );
}

function sanitizeThemeCore(value) {
  return String(value || '')
    .replace(/^이 대화는\s*/u, '')
    .replace(/[:：]\s*/g, ' ')
    .replace(
      /\s+(체크리스트|가이드|방법|해결하기|해결 방법|정리한 포인트|실전 포인트|포인트)$/u,
      '',
    )
    .replace(/\s+(흐름|내용|과정)이다[.]?$/u, '')
    .replace(/\s+중심으로 정리하는$/u, '')
    .replace(/\s+중심으로$/u, '')
    .replace(/\s+정리하는$/u, ' 정리')
    .replace(/\s+/g, ' ')
    .trim();
}

function ensureSentenceEnding(value) {
  const trimmed = String(value || '').trim().replace(/[.。]+$/u, '');

  if (!trimmed) {
    return '';
  }

  if (/(흐름|내용|과정)이다$/u.test(trimmed)) {
    return `${trimmed}.`;
  }

  if (/다$/u.test(trimmed)) {
    return `${trimmed}.`;
  }

  return `${trimmed}.`;
}

function formatTranscript(messages) {
  return (messages || [])
    .map((message) => `#${message.order} [${sanitizeRole(message.role)}] ${message.text}`)
    .join('\n');
}

function sanitizeList(value, limit) {
  if (!Array.isArray(value)) {
    return [];
  }

  return uniqueList(value).slice(0, limit);
}

function uniqueList(value) {
  return Array.from(
    new Set(
      value
        .map((item) => String(item || '').trim())
        .filter(Boolean),
    ),
  );
}

function normalizeCategory(category) {
  const normalized = String(category || '').trim().toLowerCase();
  return ALLOWED_CATEGORIES.includes(normalized) ? normalized : 'tutorial';
}

function sanitizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'assistant' ? 'assistant' : 'user';
}

function trimText(value, limit) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trim()}…`;
}

function estimateTurnSize(message) {
  return String(message.text || '').length + 32;
}

function sumSelectedChars(messages, keepIndexes) {
  return messages.reduce((total, message) => {
    return keepIndexes.has(message._index)
      ? total + estimateTurnSize(message)
      : total;
  }, 0);
}

function extractTerms(text) {
  return Array.from(
    new Set(
      String(text || '')
        .toLowerCase()
        .match(/[a-z][a-z0-9+._/-]{2,}|[가-힣]{2,}/g) || [],
    ),
  ).filter((term) => !STOP_WORDS.has(term));
}

function wrapStageError(stage, error) {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`${stage}: ${message}`);
}

module.exports = {
  buildContext,
  createDraftFromContext,
  createImportAnalysis,
  createSessionReply,
  createStarterMessage,
  fitFinalPromptPayload,
  prepareMessagesForImport,
};
