function createOauthClient(config) {
  let cachedModel = null;
  let cachedModelExpiresAt = 0;

  return {
    async health() {
      try {
        const models = await listModels(config);
        const model = chooseModel(models, config);
        return {
          ok: true,
          model,
          reason: null,
          status: 'worker',
          upstreamReady: true,
        };
      } catch (error) {
        return {
          ok: false,
          model: null,
          reason: error instanceof Error ? error.message : 'upstream unavailable',
          status: 'unavailable',
          upstreamReady: false,
        };
      }
    },

    async completeJson({ systemPrompt, userPrompt, temperature = 0.2 }) {
      const model = await resolveModelForCompletion();
      try {
        const response = await fetch(`${config.upstreamBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            temperature,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: AbortSignal.timeout(config.requestTimeoutMs),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Upstream completion failed: ${response.status} ${errorText || response.statusText}`,
          );
        }

        const payload = await response.json();
        const content = payload?.choices?.[0]?.message?.content;

        if (!content || typeof content !== 'string') {
          throw new Error('Upstream response did not contain message content.');
        }

        return parseJsonContent(content);
      } catch (error) {
        invalidateCachedModel();
        throw error;
      }
    },
  };

  async function resolveModelForCompletion() {
    if (config.modelOverride) {
      return config.modelOverride;
    }

    const now = Date.now();
    if (cachedModel && cachedModelExpiresAt > now) {
      return cachedModel;
    }

    const models = await listModels(config);
    const model = chooseModel(models, config);
    const ttlMs = getModelCacheTtlMs(config);
    cachedModel = model;
    cachedModelExpiresAt = now + ttlMs;
    return model;
  }

  function invalidateCachedModel() {
    cachedModel = null;
    cachedModelExpiresAt = 0;
  }
}

async function listModels(config) {
  const response = await fetch(`${config.upstreamBaseUrl}/models`, {
    headers: {
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Upstream models failed: ${response.status} ${errorText || response.statusText}`,
    );
  }

  const payload = await response.json();
  return Array.isArray(payload?.data) ? payload.data : [];
}

function chooseModel(models, config) {
  if (config.modelOverride) {
    return config.modelOverride;
  }

  const availableIds = models
    .map((model) => model && typeof model.id === 'string' ? model.id : null)
    .filter(Boolean);

  for (const preferredModel of config.preferredModels) {
    if (availableIds.includes(preferredModel)) {
      return preferredModel;
    }
  }

  if (availableIds.length === 0) {
    throw new Error('No upstream models available.');
  }

  return availableIds[0];
}

function getModelCacheTtlMs(config) {
  const ttlMs = Number(config.modelCacheTtlMs);
  return Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : 15000;
}

function parseJsonContent(content) {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const rawJson = fencedMatch ? fencedMatch[1].trim() : content.trim();

  try {
    return JSON.parse(rawJson);
  } catch (_error) {
    const firstBrace = rawJson.indexOf('{');
    const lastBrace = rawJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(rawJson.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('Model response was not valid JSON.');
  }
}

module.exports = {
  createOauthClient,
};
