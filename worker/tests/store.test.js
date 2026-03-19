const test = require('node:test');
const assert = require('node:assert/strict');
const { purgeExpiredRecords } = require('../src/store');

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
