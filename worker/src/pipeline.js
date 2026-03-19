const ALLOWED_CATEGORIES = [
  'frontend',
  'backend',
  'devops',
  'cloud',
  'database',
  'tutorial',
];

async function createImportAnalysis({ body, oauthClient }) {
  const transcript = formatTranscript(body.messages);
  const response = await oauthClient.completeJson({
    systemPrompt: [
      'You are a blog ideation agent for a personal engineering blog.',
      'Return strict JSON only.',
      'Summarize the conversation and propose 3 to 5 blog ideas.',
      'Category must be one of frontend, backend, devops, cloud, database, tutorial.',
      'Each candidate must include title, category, tags, keywords, evidenceSnippet, score, continuationBrief, sourceMessageRefs.',
      'sourceMessageRefs must contain transcript turn numbers relevant to the idea.',
    ].join(' '),
    userPrompt: JSON.stringify(
      {
        sourceTitle: body.sourceTitle,
        sourceUrl: body.sourceUrl,
        transcript,
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
      null,
      2,
    ),
  });

  return {
    summary: normalizeSummary(response),
    candidates: normalizeCandidates(response.candidates || [], response),
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
      null,
      2,
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
      null,
      2,
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

function buildContext(context, rawConversation) {
  return {
    sourceTitle: context.sourceTitle,
    sourceUrl: context.sourceUrl,
    title: context.title,
    category: context.category,
    tags: context.tags || [],
    keywords: context.keywords || [],
    summaryShort: context.summaryShort || '',
    summaryLong: context.summaryLong || '',
    keyPoints: context.keyPoints || [],
    technicalTopics: context.technicalTopics || [],
    decisions: context.decisions || [],
    openQuestions: context.openQuestions || [],
    evidenceSnippets: context.evidenceSnippets || [],
    continuationBrief: context.continuationBrief || '',
    rawTranscriptExcerpt: rawConversation
      ? formatTranscript(rawConversation.messages).slice(0, 8000)
      : '',
  };
}

function formatTranscript(messages) {
  return (messages || [])
    .map((message) => `#${message.order} [${message.role}] ${message.text}`)
    .join('\n');
}

function normalizeSummary(response) {
  return {
    summaryShort: trimText(String(response.summaryShort || ''), 200),
    summaryLong: trimText(String(response.summaryLong || response.summaryShort || ''), 2000),
    keyPoints: sanitizeList(response.keyPoints, 6),
    technicalTopics: sanitizeList(response.technicalTopics, 8),
    decisions: sanitizeList(response.decisions, 4),
    openQuestions: sanitizeList(response.openQuestions, 4),
    evidenceSnippets: sanitizeList(response.evidenceSnippets, 5),
    continuationBrief: trimText(String(response.continuationBrief || ''), 2000),
  };
}

function normalizeCandidates(candidates, response) {
  return candidates
    .map((candidate) => ({
      title: trimText(String(candidate.title || ''), 120),
      category: normalizeCategory(candidate.category),
      tags: sanitizeList(candidate.tags, 5),
      keywords: sanitizeList(candidate.keywords, 8),
      evidenceSnippet: trimText(
        String(candidate.evidenceSnippet || response.summaryShort || ''),
        240,
      ),
      score: Number.isFinite(candidate.score) ? candidate.score : 1,
      continuationBrief: trimText(
        String(candidate.continuationBrief || response.continuationBrief || ''),
        1200,
      ),
      sourceMessageRefs: Array.isArray(candidate.sourceMessageRefs)
        ? candidate.sourceMessageRefs
            .filter((value) => Number.isInteger(value) && value >= 0)
            .slice(0, 8)
        : [],
    }))
    .filter((candidate) => candidate.title.length > 0)
    .slice(0, 5);
}

function sanitizeList(value, limit) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => String(item || '').trim())
        .filter(Boolean),
    ),
  ).slice(0, limit);
}

function normalizeCategory(category) {
  const normalized = String(category || '').trim().toLowerCase();
  return ALLOWED_CATEGORIES.includes(normalized) ? normalized : 'tutorial';
}

function trimText(value, limit) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trim()}…`;
}

module.exports = {
  createImportAnalysis,
  createStarterMessage,
  createSessionReply,
  createDraftFromContext,
};
