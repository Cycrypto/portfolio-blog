const HANDOFF_PREFIX = 'idea-handoff:';
const PROD_BASE_URL = 'https://junha.space';
const DEV_BASE_URL = 'http://localhost:3000';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'store-idea-handoff') {
    handleStoreIdeaHandoff(message.payload)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'handoff 저장 실패',
        }),
      );
    return true;
  }

  if (message?.type === 'consume-idea-handoff') {
    handleConsumeIdeaHandoff(message.handoffId)
      .then((payload) => sendResponse({ ok: true, payload }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'handoff 조회 실패',
        }),
      );
    return true;
  }

  return undefined;
});

async function handleStoreIdeaHandoff(payload) {
  if (!payload || !payload.sourceUrl || !Array.isArray(payload.messages)) {
    throw new Error('유효한 대화 payload가 아닙니다.');
  }

  const handoffId = crypto.randomUUID();
  const storageKey = `${HANDOFF_PREFIX}${handoffId}`;

  await chrome.storage.session.set({
    [storageKey]: payload,
  });

  const baseUrl = await resolveTargetBaseUrl();
  const targetUrl = `${baseUrl}/admin/posts/new?ideaHandoff=${encodeURIComponent(handoffId)}`;

  await chrome.tabs.create({ url: targetUrl });

  return {
    handoffId,
    targetUrl,
  };
}

async function handleConsumeIdeaHandoff(handoffId) {
  if (!handoffId) {
    return null;
  }

  const storageKey = `${HANDOFF_PREFIX}${handoffId}`;
  const stored = await chrome.storage.session.get(storageKey);
  const payload = stored[storageKey] || null;

  if (payload) {
    await chrome.storage.session.remove(storageKey);
  }

  return payload;
}

async function resolveTargetBaseUrl() {
  const devTabs = await chrome.tabs.query({ url: `${DEV_BASE_URL}/*` });
  if (devTabs.length > 0) {
    return DEV_BASE_URL;
  }

  return PROD_BASE_URL;
}
