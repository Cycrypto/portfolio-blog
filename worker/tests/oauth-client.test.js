const test = require('node:test');
const assert = require('node:assert/strict');
const { createOauthClient } = require('../src/oauth-client');

test('completeJson caches the chosen model for a short TTL', async () => {
  const originalFetch = global.fetch;
  const originalDateNow = Date.now;
  let now = 1_000;
  const calls = [];

  Date.now = () => now;
  global.fetch = async (url, options = {}) => {
    calls.push({
      url,
      body: options.body ? JSON.parse(options.body) : null,
    });

    if (url.endsWith('/models')) {
      return createJsonResponse({
        data: [{ id: 'gpt-5.4-mini' }],
      });
    }

    if (url.endsWith('/chat/completions')) {
      return createJsonResponse({
        choices: [
          {
            message: {
              content: '{"reply":"ok"}',
            },
          },
        ],
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  try {
    const client = createOauthClient({
      upstreamBaseUrl: 'http://worker-upstream.test/v1',
      preferredModels: ['gpt-5.4-mini'],
      modelOverride: null,
      modelCacheTtlMs: 5_000,
      requestTimeoutMs: 1_000,
    });

    await client.completeJson({ systemPrompt: 'system', userPrompt: 'first' });
    await client.completeJson({ systemPrompt: 'system', userPrompt: 'second' });
    now += 6_000;
    await client.completeJson({ systemPrompt: 'system', userPrompt: 'third' });
  } finally {
    global.fetch = originalFetch;
    Date.now = originalDateNow;
  }

  const modelCalls = calls.filter((call) => call.url.endsWith('/models'));
  const completionCalls = calls.filter((call) =>
    call.url.endsWith('/chat/completions'),
  );

  assert.equal(modelCalls.length, 2);
  assert.equal(completionCalls.length, 3);
  assert.equal(completionCalls[0].body.model, 'gpt-5.4-mini');
  assert.equal(completionCalls[1].body.model, 'gpt-5.4-mini');
  assert.equal(completionCalls[2].body.model, 'gpt-5.4-mini');
});

test('completeJson invalidates the cached model after a failed completion', async () => {
  const originalFetch = global.fetch;
  const originalDateNow = Date.now;
  let now = 1_000;
  let completionAttempt = 0;
  const calls = [];

  Date.now = () => now;
  global.fetch = async (url, options = {}) => {
    calls.push({
      url,
      body: options.body ? JSON.parse(options.body) : null,
    });

    if (url.endsWith('/models')) {
      return createJsonResponse({
        data: [{ id: 'gpt-5.4-mini' }],
      });
    }

    if (url.endsWith('/chat/completions')) {
      completionAttempt += 1;
      if (completionAttempt === 1) {
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          async text() {
            return 'temporary upstream failure';
          },
        };
      }

      return createJsonResponse({
        choices: [
          {
            message: {
              content: '{"reply":"ok"}',
            },
          },
        ],
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  try {
    const client = createOauthClient({
      upstreamBaseUrl: 'http://worker-upstream.test/v1',
      preferredModels: ['gpt-5.4-mini'],
      modelOverride: null,
      modelCacheTtlMs: 60_000,
      requestTimeoutMs: 1_000,
    });

    await assert.rejects(
      client.completeJson({ systemPrompt: 'system', userPrompt: 'first' }),
      /Upstream completion failed: 503 temporary upstream failure/,
    );
    await client.completeJson({ systemPrompt: 'system', userPrompt: 'second' });
  } finally {
    global.fetch = originalFetch;
    Date.now = originalDateNow;
  }

  const modelCalls = calls.filter((call) => call.url.endsWith('/models'));
  const completionCalls = calls.filter((call) =>
    call.url.endsWith('/chat/completions'),
  );

  assert.equal(modelCalls.length, 2);
  assert.equal(completionCalls.length, 2);
});

function createJsonResponse(payload) {
  return {
    ok: true,
    async json() {
      return payload;
    },
    async text() {
      return JSON.stringify(payload);
    },
  };
}
