const extractButton = document.getElementById('extract-button');
const statusElement = document.getElementById('status');

initializePopup().catch((error) => {
  setStatus(
    error instanceof Error ? error.message : '확장을 초기화하지 못했습니다.',
    'error',
  );
});

extractButton.addEventListener('click', async () => {
  try {
    setLoading(true);

    const activeTab = await getActiveTab();
    if (!activeTab?.id || !isSupportedChatGptUrl(activeTab.url)) {
      throw new Error('현재 ChatGPT 대화 탭에서만 사용할 수 있습니다.');
    }

    await ensureChatGptContentScript(activeTab.id);

    const extractionResult = await sendMessageToTab(activeTab.id, {
      type: 'extract-chatgpt-conversation',
    });

    if (!extractionResult?.ok || !extractionResult.payload) {
      throw new Error(
        extractionResult?.error || '현재 대화에서 글감을 추출하지 못했습니다.',
      );
    }

    const handoffResult = await sendRuntimeMessage({
      type: 'store-idea-handoff',
      payload: extractionResult.payload,
    });

    if (!handoffResult?.ok) {
      throw new Error(handoffResult?.error || 'junha.space로 전달하지 못했습니다.');
    }

    setStatus('junha.space 글쓰기 화면을 열었습니다.', 'success');
  } catch (error) {
    setStatus(
      error instanceof Error ? error.message : '글감 가져오기에 실패했습니다.',
      'error',
    );
  } finally {
    setLoading(false);
  }
});

async function initializePopup() {
  const activeTab = await getActiveTab();
  if (!isSupportedChatGptUrl(activeTab?.url)) {
    setStatus('ChatGPT 현재 대화 탭에서 실행해주세요.', 'error');
    extractButton.disabled = true;
    return;
  }

  setStatus('현재 대화에서 글감 후보를 가져올 준비가 되었습니다.');
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isSupportedChatGptUrl(url) {
  if (!url) {
    return false;
  }

  return (
    (url.startsWith('https://chatgpt.com/') ||
      url.startsWith('https://chat.openai.com/')) &&
    !url.includes('/auth/') &&
    !url.includes('/share/')
  );
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

async function ensureChatGptContentScript(tabId) {
  try {
    const pingResponse = await sendMessageToTab(tabId, {
      type: 'chatgpt-content-ready',
    });

    if (pingResponse?.ok) {
      return;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'content script 연결 실패';

    if (!errorMessage.includes('Receiving end does not exist')) {
      throw error;
    }
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content/chatgpt.js'],
  });

  const readyResponse = await sendMessageToTab(tabId, {
    type: 'chatgpt-content-ready',
  });

  if (!readyResponse?.ok) {
    throw new Error('ChatGPT 대화 추출 스크립트를 준비하지 못했습니다.');
  }
}

function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

function setLoading(isLoading) {
  extractButton.disabled = isLoading;
  extractButton.textContent = isLoading
    ? '가져오는 중...'
    : '이 대화에서 글감 가져오기';
}

function setStatus(message, tone = '') {
  statusElement.textContent = message;
  statusElement.className = ['status', tone].filter(Boolean).join(' ');
}
