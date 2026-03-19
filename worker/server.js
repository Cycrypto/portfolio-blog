const http = require('http');
const { URL } = require('url');
const { createConfig } = require('./src/config');
const { createStore } = require('./src/store');
const { createOauthClient } = require('./src/oauth-client');
const {
  createDraftFromContext,
  createImportAnalysis,
  createSessionReply,
  createStarterMessage,
} = require('./src/pipeline');

const config = createConfig();
const store = createStore(config);
const oauthClient = createOauthClient(config);

if (!config.internalToken) {
  console.error('AI_WORKER_INTERNAL_TOKEN is required to start the AI worker.');
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  try {
    if (!authorizeRequest(req, res, config)) {
      return;
    }

    if (req.method === 'GET' && url.pathname === '/internal/health') {
      const health = await oauthClient.health();
      return writeJson(res, 200, health);
    }

    if (req.method === 'POST' && url.pathname === '/internal/imports/chatgpt') {
      const body = await readJsonBody(req);
      const analysis = await createImportAnalysis({
        body,
        oauthClient,
        config,
      });

      const record = store.saveRawConversation({
        sourceTitle: body.sourceTitle,
        sourceUrl: body.sourceUrl,
        extractedAt: body.extractedAt,
        messages: body.messages,
        summary: analysis.summary,
        candidates: analysis.candidates,
        memory: analysis.memory,
      });

      return writeJson(res, 200, {
        workerImportId: record.id,
        summary: analysis.summary,
        candidates: analysis.candidates,
      });
    }

    const sessionMatch = matchRoute(url.pathname, '/internal/ideas/:id/session');
    if (req.method === 'POST' && sessionMatch) {
      const body = await readJsonBody(req);
      const starterMessage = createStarterMessage(body);
      const session = store.createSession({
        ideaCandidateId: Number(sessionMatch.params.id),
        workerImportId: body.workerImportId || null,
        context: body,
        starterMessage,
      });

      return writeJson(res, 200, {
        workerSessionId: session.id,
        starterMessage,
        sessionSummary: session.summary,
      });
    }

    const messageMatch = matchRoute(
      url.pathname,
      '/internal/sessions/:id/messages',
    );
    if (req.method === 'POST' && messageMatch) {
      const body = await readJsonBody(req);
      const session = store.getSession(messageMatch.params.id);
      if (!session) {
        return writeJson(res, 404, { error: '세션을 찾을 수 없습니다.' });
      }

      const reply = await createSessionReply({
        message: body.message,
        oauthClient,
        session,
        rawConversation: session.workerImportId
          ? store.getRawConversation(session.workerImportId)
          : null,
      });

      store.appendSessionMessages(session.id, body.message, reply);

      return writeJson(res, 200, reply);
    }

    const draftMatch = matchRoute(url.pathname, '/internal/ideas/:id/draft');
    if (req.method === 'POST' && draftMatch) {
      const body = await readJsonBody(req);
      const session = body.sessionId ? store.getSession(body.sessionId) : null;
      const draft = await createDraftFromContext({
        context: body,
        oauthClient,
        rawConversation: body.workerImportId
          ? store.getRawConversation(body.workerImportId)
          : null,
        session,
      });

      return writeJson(res, 200, draft);
    }

    return writeJson(res, 404, { error: '지원하지 않는 경로입니다.' });
  } catch (error) {
    const statusCode = error && typeof error.statusCode === 'number' ? error.statusCode : 500;
    return writeJson(res, statusCode, {
      error: error instanceof Error ? error.message : 'internal error',
    });
  }
});

server.listen(config.port, config.host, () => {
  store.cleanupExpired();
  setInterval(() => store.cleanupExpired(), 60 * 60 * 1000).unref();
  console.log(
    `junha-space-ai-worker listening on http://${config.host}:${config.port}`,
  );
});

function authorizeRequest(req, res, configValue) {
  if (!configValue.internalToken) {
    return true;
  }

  const authHeader = req.headers.authorization || '';
  if (authHeader === `Bearer ${configValue.internalToken}`) {
    return true;
  }

  writeJson(res, 401, { error: 'Unauthorized' });
  return false;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(createHttpError(413, '요청 본문이 너무 큽니다.'));
      }
    });

    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_error) {
        reject(createHttpError(400, 'JSON 본문을 해석하지 못했습니다.'));
      }
    });

    req.on('error', reject);
  });
}

function writeJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(body));
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function matchRoute(pathname, pattern) {
  const actual = pathname.split('/').filter(Boolean);
  const expected = pattern.split('/').filter(Boolean);

  if (actual.length !== expected.length) {
    return null;
  }

  const params = {};

  for (let index = 0; index < expected.length; index += 1) {
    const expectedSegment = expected[index];
    const actualSegment = actual[index];

    if (expectedSegment.startsWith(':')) {
      params[expectedSegment.slice(1)] = actualSegment;
      continue;
    }

    if (expectedSegment !== actualSegment) {
      return null;
    }
  }

  return { params };
}
