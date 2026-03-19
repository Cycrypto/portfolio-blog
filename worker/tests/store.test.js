const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStore, purgeExpiredRecords } = require('../src/store');

test('purgeExpiredRecords removes expired raw conversations and sessions', () => {
  const now = Date.now();
  const store = {
    rawConversations: [
      { id: 'a', expiresAt: new Date(now + 60_000).toISOString() },
      { id: 'b', expiresAt: new Date(now - 60_000).toISOString() },
    ],
    sessions: [
      { id: 'c', expiresAt: new Date(now + 60_000).toISOString() },
      { id: 'd', expiresAt: new Date(now - 60_000).toISOString() },
    ],
  };

  const result = purgeExpiredRecords(store);

  assert.deepEqual(result.rawConversations.map((item) => item.id), ['a']);
  assert.deepEqual(result.sessions.map((item) => item.id), ['c']);
});

test('saveRawConversation persists memory alongside raw transcript', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-store-'));
  const store = createStore({
    dataDir: tempDir,
    dbPath: path.join(tempDir, 'store.json'),
    rawTtlMs: 60_000,
  });

  const record = store.saveRawConversation({
    sourceTitle: 'Long import',
    sourceUrl: 'https://chatgpt.com/c/example',
    extractedAt: new Date().toISOString(),
    messages: [{ order: 0, role: 'user', text: 'hello' }],
    summary: { summaryShort: 'short' },
    candidates: [],
    memory: {
      rollingSummary: { summaryShort: 'memory short' },
      salientTurns: [{ order: 0, role: 'user', text: 'hello', score: 5 }],
    },
  });

  const restored = store.getRawConversation(record.id);

  assert.equal(restored.memory.rollingSummary.summaryShort, 'memory short');
  assert.equal(restored.memory.salientTurns[0].order, 0);
});
