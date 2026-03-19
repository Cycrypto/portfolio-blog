const os = require('os');
const path = require('path');

function createConfig() {
  const dataDir =
    process.env.WORKER_DATA_DIR ||
    path.join(os.homedir(), '.junha-space-ai-worker');
  const internalToken = (process.env.AI_WORKER_INTERNAL_TOKEN || '').trim();

  return {
    host: process.env.WORKER_HOST || '127.0.0.1',
    port: Number(process.env.WORKER_PORT || 11434),
    dataDir,
    dbPath: path.join(dataDir, 'store.json'),
    upstreamBaseUrl:
      process.env.OPENAI_OAUTH_BASE_URL || 'http://127.0.0.1:10531/v1',
    preferredModels: (
      process.env.AI_WORKER_MODELS || 'gpt-5.4,gpt-5.3-codex'
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    modelOverride: process.env.AI_WORKER_MODEL || null,
    requestTimeoutMs: Number(process.env.AI_WORKER_REQUEST_TIMEOUT_MS || 30000),
    internalToken,
    rawTtlMs: Number(process.env.AI_WORKER_RAW_TTL_HOURS || 168) * 60 * 60 * 1000,
  };
}

module.exports = {
  createConfig,
};
