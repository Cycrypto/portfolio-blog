const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function createStore(config) {
  ensureDir(config.dataDir);
  ensureFile(config.dbPath);

  return {
    saveRawConversation(input) {
      const store = readStore(config.dbPath);
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + config.rawTtlMs).toISOString();
      const record = {
        id: crypto.randomUUID(),
        sourceTitle: input.sourceTitle,
        sourceUrl: input.sourceUrl,
        extractedAt: input.extractedAt,
        messages: input.messages,
        summary: input.summary,
        candidates: input.candidates,
        memory: input.memory || null,
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      store.rawConversations.push(record);
      writeStore(config.dbPath, purgeExpiredRecords(store));
      return record;
    },

    getRawConversation(id) {
      const store = purgeExpiredRecords(readStore(config.dbPath));
      writeStore(config.dbPath, store);
      return store.rawConversations.find((record) => record.id === id) || null;
    },

    createSession(input) {
      const store = readStore(config.dbPath);
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + config.rawTtlMs).toISOString();
      const session = {
        id: crypto.randomUUID(),
        ideaCandidateId: input.ideaCandidateId,
        workerImportId: input.workerImportId,
        context: input.context,
        summary: input.context.summaryShort || '',
        messages: [
          {
            role: 'assistant',
            content: input.starterMessage,
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
        expiresAt,
      };

      store.sessions.push(session);
      writeStore(config.dbPath, purgeExpiredRecords(store));
      return session;
    },

    getSession(id) {
      const store = purgeExpiredRecords(readStore(config.dbPath));
      writeStore(config.dbPath, store);
      return store.sessions.find((session) => session.id === id) || null;
    },

    appendSessionMessages(sessionId, userMessage, reply) {
      const store = readStore(config.dbPath);
      const session = store.sessions.find((record) => record.id === sessionId);
      if (!session) {
        return null;
      }

      const now = new Date().toISOString();
      session.messages.push({
        role: 'user',
        content: userMessage,
        createdAt: now,
      });
      session.messages.push({
        role: 'assistant',
        content: reply.reply,
        createdAt: now,
      });
      session.summary = reply.sessionSummary;
      session.updatedAt = now;
      session.expiresAt = new Date(Date.now() + config.rawTtlMs).toISOString();
      writeStore(config.dbPath, purgeExpiredRecords(store));
      return session;
    },

    cleanupExpired() {
      const store = purgeExpiredRecords(readStore(config.dbPath));
      writeStore(config.dbPath, store);
      return store;
    },
  };
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      JSON.stringify({ rawConversations: [], sessions: [] }, null, 2),
      'utf8',
    );
  }
}

function readStore(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_error) {
    return { rawConversations: [], sessions: [] };
  }
}

function writeStore(filePath, store) {
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
}

function purgeExpiredRecords(store) {
  const now = Date.now();

  return {
    rawConversations: (store.rawConversations || []).filter(
      (record) => Date.parse(record.expiresAt || 0) > now,
    ),
    sessions: (store.sessions || []).filter(
      (session) => Date.parse(session.expiresAt || 0) > now,
    ),
  };
}

module.exports = {
  createStore,
  purgeExpiredRecords,
};
