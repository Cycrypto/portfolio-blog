const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDraftFromContext,
  createImportAnalysis,
  fitFinalPromptPayload,
} = require('../src/pipeline');

function createConfig(overrides = {}) {
  return {
    importMaxChars: 9000,
    importChunkChars: 280,
    importMaxSalientTurns: 4,
    importMaxFinalPromptChars: 1400,
    ...overrides,
  };
}

test('createImportAnalysis chunks long transcripts and reduces final prompt size', async () => {
  const calls = [];
  const oauthClient = {
    completeJson: async ({ systemPrompt, userPrompt }) => {
      calls.push({ systemPrompt, userPrompt });

      if (systemPrompt.includes('summarizing one chunk of a longer ChatGPT conversation')) {
        const payload = JSON.parse(userPrompt);
        const turnOrders = Array.from(
          payload.transcript.matchAll(/#(\d+)/g),
          (match) => Number(match[1]),
        );
        return {
          summaryShort: `chunk ${payload.chunkIndex}`,
          keyPoints: [`point ${payload.chunkIndex}`],
          technicalTopics: [`topic ${payload.chunkIndex}`],
          decisions: payload.chunkIndex === 1 ? ['changed cache strategy'] : [],
          openQuestions: payload.chunkIndex === payload.totalChunks ? ['what to monitor next'] : [],
          evidenceSnippets: [`snippet ${payload.chunkIndex}`],
          candidateTurnOrders: turnOrders.slice(0, 2),
        };
      }

      const payload = JSON.parse(userPrompt);
      return {
        summaryShort: 'Next.js 운영 캐시 무효화 전략',
        summaryLong: 'final long summary',
        keyPoints: payload.conversationMemory.keyPoints,
        technicalTopics: payload.conversationMemory.technicalTopics,
        decisions: payload.conversationMemory.decisions,
        openQuestions: payload.conversationMemory.openQuestions,
        evidenceSnippets: payload.conversationMemory.evidenceSnippets,
        continuationBrief: 'Continue with the production debugging timeline.',
        candidates: [
          {
            title: 'Next.js 운영 캐시 무효화 전략',
            category: 'frontend',
            tags: ['Next.js', 'Caching'],
            keywords: ['revalidate', 'stale data'],
            evidenceSnippet: payload.conversationMemory.evidenceSnippets[0],
            score: 9,
            continuationBrief: 'Expand on the stale data investigation.',
            sourceMessageRefs: payload.conversationMemory.salientTurns.map((turn) => turn.order),
          },
        ],
      };
    },
  };

  const messages = Array.from({ length: 12 }, (_, index) => ({
    order: index,
    role: index % 2 === 0 ? 'user' : 'assistant',
    text: [
      `Turn ${index} about fixing a Next.js stale cache bug in production.`,
      'We changed the revalidate strategy, added stale data handling,',
      'and compared the new behavior against the previous fetch caching setup.',
      'This includes concrete debugging notes, deployment checks, and follow-up questions.',
    ].join(' '),
  }));

  const result = await createImportAnalysis({
    body: {
      sourceTitle: 'Next.js cache issue',
      sourceUrl: 'https://chatgpt.com/c/test-long',
      extractedAt: new Date().toISOString(),
      messages,
    },
    oauthClient,
    config: createConfig(),
  });

  assert.equal(result.candidates.length, 1);
  assert.ok(result.memory.chunkSummaries.length >= 2);
  assert.ok(result.memory.salientTurns.length <= 4);
  assert.match(result.summary.summaryShort, /^이 대화는 /);
  assert.match(result.candidates[0].title, /^이 대화는 /);
  assert.ok(result.candidates[0].title.endsWith('.'));

  const finalCall = calls[calls.length - 1];
  const finalPayload = JSON.parse(finalCall.userPrompt);

  assert.ok(finalCall.userPrompt.length <= 1400);
  assert.ok(!('transcript' in finalPayload));
  assert.ok(Array.isArray(finalPayload.conversationMemory.salientTurns));
  assert.ok(finalPayload.conversationMemory.salientTurns.length <= 4);
});

test('createImportAnalysis retries with smaller chunks after a chunk summary failure', async () => {
  let chunkAttempt = 0;
  const oauthClient = {
    completeJson: async ({ systemPrompt, userPrompt }) => {
      if (systemPrompt.includes('summarizing one chunk of a longer ChatGPT conversation')) {
        chunkAttempt += 1;
        if (chunkAttempt === 1) {
          throw new Error('stream failed');
        }

        const payload = JSON.parse(userPrompt);
        const turnOrders = Array.from(
          payload.transcript.matchAll(/#(\d+)/g),
          (match) => Number(match[1]),
        );

        return {
          summaryShort: `chunk ${payload.chunkIndex}`,
          keyPoints: [`point ${payload.chunkIndex}`],
          technicalTopics: ['next.js'],
          decisions: [],
          openQuestions: [],
          evidenceSnippets: ['snippet'],
          candidateTurnOrders: turnOrders.slice(0, 1),
        };
      }

      return {
        summaryShort: 'Retry flow summary',
        summaryLong: 'done long',
        keyPoints: ['point'],
        technicalTopics: ['next.js'],
        decisions: [],
        openQuestions: [],
        evidenceSnippets: ['snippet'],
        continuationBrief: 'continue',
        candidates: [
          {
            title: 'cache retry recovery',
            category: 'frontend',
            tags: ['Next.js'],
            keywords: ['retry'],
            evidenceSnippet: 'snippet',
            score: 7,
            continuationBrief: 'continue',
            sourceMessageRefs: [0],
          },
        ],
      };
    },
  };

  const result = await createImportAnalysis({
    body: {
      sourceTitle: 'Retry flow',
      sourceUrl: 'https://chatgpt.com/c/retry',
      extractedAt: new Date().toISOString(),
      messages: Array.from({ length: 8 }, (_, index) => ({
        order: index,
        role: index % 2 === 0 ? 'user' : 'assistant',
        text: `Turn ${index} discusses a cache bug, a fix, and production debugging details.`,
      })),
    },
    oauthClient,
    config: createConfig({ importChunkChars: 220 }),
  });

  assert.match(result.candidates[0].title, /^이 대화는 /);
  assert.equal(result.memory.reducedTranscriptStats.retriedWithSmallerChunks, true);
  assert.ok(chunkAttempt >= 2);
});

test('createImportAnalysis retries the final idea analysis once after a transient failure', async () => {
  let finalAttempt = 0;
  const oauthClient = {
    completeJson: async ({ systemPrompt, userPrompt }) => {
      if (systemPrompt.includes('summarizing one chunk of a longer ChatGPT conversation')) {
        const payload = JSON.parse(userPrompt);
        const turnOrders = Array.from(
          payload.transcript.matchAll(/#(\d+)/g),
          (match) => Number(match[1]),
        );

        return {
          summaryShort: `chunk ${payload.chunkIndex}`,
          keyPoints: ['point'],
          technicalTopics: ['next.js'],
          decisions: [],
          openQuestions: [],
          evidenceSnippets: ['snippet'],
          candidateTurnOrders: turnOrders.slice(0, 1),
        };
      }

      finalAttempt += 1;
      if (finalAttempt === 1) {
        throw new Error('Model response was not valid JSON.');
      }

      return {
        summaryShort: 'Recovered final summary',
        summaryLong: 'Recovered long summary',
        keyPoints: ['point'],
        technicalTopics: ['next.js'],
        decisions: [],
        openQuestions: [],
        evidenceSnippets: ['snippet'],
        continuationBrief: 'continue',
        candidates: [
          {
            title: 'final analysis recovered',
            category: 'frontend',
            tags: ['Next.js'],
            keywords: ['retry'],
            evidenceSnippet: 'snippet',
            score: 7,
            continuationBrief: 'continue',
            sourceMessageRefs: [0],
          },
        ],
      };
    },
  };

  const result = await createImportAnalysis({
    body: {
      sourceTitle: 'Final retry flow',
      sourceUrl: 'https://chatgpt.com/c/final-retry',
      extractedAt: new Date().toISOString(),
      messages: Array.from({ length: 4 }, (_, index) => ({
        order: index,
        role: index % 2 === 0 ? 'user' : 'assistant',
        text: `Turn ${index} discusses cache recovery and import retries.`,
      })),
    },
    oauthClient,
    config: createConfig(),
  });

  assert.equal(finalAttempt, 2);
  assert.equal(result.candidates.length, 1);
  assert.match(result.candidates[0].title, /^이 대화는 /);
});

test('createImportAnalysis keeps non-technical themes non-technical when the memory says so', async () => {
  const oauthClient = {
    completeJson: async ({ systemPrompt, userPrompt }) => {
      if (systemPrompt.includes('summarizing one chunk of a longer ChatGPT conversation')) {
        return {
          summaryShort: '일정 충돌과 재계획 추천 흐름',
          keyPoints: ['일정 충돌 검증', '재계획 추천 기준'],
          technicalTopics: [],
          decisions: ['변경 사유를 함께 기록하기'],
          openQuestions: ['어떤 우선순위 기준을 먼저 둘지'],
          evidenceSnippets: ['일정 충돌과 재계획 추천이 반복적으로 언급됐다'],
          candidateTurnOrders: [0, 1],
        };
      }

      const payload = JSON.parse(userPrompt);
      return {
        summaryShort: '일정 충돌과 재계획 추천 기준 정리',
        summaryLong: 'final long summary',
        keyPoints: payload.conversationMemory.keyPoints,
        technicalTopics: [],
        decisions: payload.conversationMemory.decisions,
        openQuestions: payload.conversationMemory.openQuestions,
        evidenceSnippets: payload.conversationMemory.evidenceSnippets,
        continuationBrief: '학생 일정표 예시로 흐름을 다시 설명한다.',
        candidates: [
          {
            title: '일정 충돌과 재계획 추천 기준 정리',
            category: 'tutorial',
            tags: [],
            keywords: ['일정 충돌', '재계획 추천'],
            evidenceSnippet: '일정 충돌과 재계획 추천이 대화 전반에 반복됐다',
            score: 8,
            continuationBrief: '학생 일정표 예시로 흐름을 다시 설명한다.',
            sourceMessageRefs: [0, 1],
          },
        ],
      };
    },
  };

  const result = await createImportAnalysis({
    body: {
      sourceTitle: '일정 검증과 재계획 추천',
      sourceUrl: 'https://chatgpt.com/c/non-technical',
      extractedAt: new Date().toISOString(),
      messages: [
        {
          order: 0,
          role: 'user',
          text: '일정 충돌을 어떻게 검증하고 재계획 추천까지 이어질지 구조를 잡고 싶어요.',
        },
        {
          order: 1,
          role: 'assistant',
          text: '좋아요. 일정 충돌 검증, 변경 사유 기록, 재계획 추천 기준을 한 흐름으로 보면 됩니다.',
        },
      ],
    },
    oauthClient,
    config: createConfig(),
  });

  assert.match(result.summary.summaryShort, /^이 대화는 일정/);
  assert.equal(result.candidates[0].category, 'tutorial');
  assert.equal(result.candidates[0].tags.length, 0);
});

test('draft context prefers salient memory over the full raw transcript excerpt', async () => {
  let capturedContext = null;
  const oauthClient = {
    completeJson: async ({ userPrompt }) => {
      capturedContext = JSON.parse(userPrompt).context;
      return {
        title: 'Memory backed draft',
        category: 'frontend',
        tags: ['Next.js'],
        markdown: '# Draft',
      };
    },
  };

  await createDraftFromContext({
    context: {
      title: 'Draft idea',
      category: 'frontend',
      tags: ['Next.js'],
      keywords: ['cache'],
      summaryShort: 'A short summary',
      summaryLong: 'A longer summary',
      keyPoints: ['Point A'],
      technicalTopics: ['Next.js caching'],
      decisions: ['Changed revalidate'],
      openQuestions: ['How to monitor stale data?'],
      evidenceSnippets: ['Important snippet'],
      continuationBrief: 'Continue',
      sourceTitle: 'Source',
      sourceUrl: 'https://chatgpt.com/c/source',
    },
    oauthClient,
    session: null,
    rawConversation: {
      messages: [
        { order: 0, role: 'user', text: 'This is a long filler message that should not appear.' },
        { order: 1, role: 'assistant', text: 'Another filler message that should be ignored.' },
      ],
      memory: {
        salientTurns: [
          { order: 10, role: 'user', text: 'Important stale cache symptom', reasons: ['problem'] },
          { order: 11, role: 'assistant', text: 'Changed revalidate strategy to fix it', reasons: ['solution'] },
        ],
        chunkSummaries: [
          {
            chunkIndex: 1,
            summaryShort: 'chunk summary',
            keyPoints: ['Point A'],
            technicalTopics: ['Next.js caching'],
          },
        ],
        rollingSummary: {
          summaryShort: 'memory short',
          summaryLong: 'memory long',
          keyPoints: ['Point A'],
          technicalTopics: ['Next.js caching'],
          decisions: ['Changed revalidate'],
          openQuestions: ['How to monitor stale data?'],
          evidenceSnippets: ['Important snippet'],
        },
      },
    },
  });

  assert.equal(capturedContext.salientTurns.length, 2);
  assert.match(capturedContext.rawTranscriptExcerpt, /#10 \[user\] Important stale cache symptom/);
  assert.doesNotMatch(
    capturedContext.rawTranscriptExcerpt,
    /should not appear|should be ignored/,
  );
});

test('fitFinalPromptPayload trims oversized memory payloads', () => {
  const payload = {
    conversationMemory: {
      summaryShort: 'short',
      summaryLong: 'x'.repeat(4000),
      keyPoints: Array.from({ length: 10 }, (_, index) => `key ${index}`),
      technicalTopics: Array.from({ length: 10 }, (_, index) => `topic ${index}`),
      decisions: Array.from({ length: 6 }, (_, index) => `decision ${index}`),
      openQuestions: Array.from({ length: 6 }, (_, index) => `question ${index}`),
      evidenceSnippets: Array.from({ length: 6 }, (_, index) => `snippet ${index}`),
      salientTurns: Array.from({ length: 8 }, (_, index) => ({
        order: index,
        role: 'user',
        text: 'y'.repeat(500),
        reasons: ['technical', 'problem', 'solution'],
      })),
      reducedTranscriptStats: {
        originalTurns: 50,
        originalChars: 100000,
        selectedTurns: 12,
        selectedChars: 10000,
      },
    },
  };

  const result = fitFinalPromptPayload(payload, 1400);

  assert.ok(JSON.stringify(result).length <= 1400);
  assert.ok(result.conversationMemory.salientTurns.length <= 6);
});
