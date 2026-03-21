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
      process.env.AI_WORKER_MODELS || 'gpt-5.3-codex,gpt-5.4-mini,gpt-5.4'
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    modelOverride: process.env.AI_WORKER_MODEL || null,
    modelCacheTtlMs: Number(process.env.AI_WORKER_MODEL_CACHE_TTL_MS || 15000),
    requestTimeoutMs: Number(process.env.AI_WORKER_REQUEST_TIMEOUT_MS || 30000),
    importMaxChars: Number(process.env.AI_WORKER_IMPORT_MAX_CHARS || 24000),
    importChunkChars: Number(process.env.AI_WORKER_IMPORT_CHUNK_CHARS || 4500),
    importMaxSalientTurns: Number(
      process.env.AI_WORKER_IMPORT_MAX_SALIENT_TURNS || 10,
    ),
    importMaxFinalPromptChars: Number(
      process.env.AI_WORKER_IMPORT_MAX_FINAL_PROMPT_CHARS || 12000,
    ),
    internalToken,
    rawTtlMs: Number(process.env.AI_WORKER_RAW_TTL_HOURS || 168) * 60 * 60 * 1000,
  };
}

module.exports = {
  createConfig,
};
