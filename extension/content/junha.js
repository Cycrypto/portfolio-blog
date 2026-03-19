const currentUrl = new URL(window.location.href);
const pageHandoffId = currentUrl.searchParams.get('ideaHandoff');

if (pageHandoffId) {
  window.addEventListener('message', handleIdeaHandoffRequest);
}

async function handleIdeaHandoffRequest(event) {
  if (event.source !== window || event.origin !== window.location.origin) {
    return;
  }

  if (event.data?.type !== 'idea-handoff:request') {
    return;
  }

  const requestedHandoffId = event.data?.handoffId || pageHandoffId;
  if (!requestedHandoffId || requestedHandoffId !== pageHandoffId) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'consume-idea-handoff',
      handoffId: requestedHandoffId,
    });

    if (!response?.ok || !response.payload) {
      return;
    }

    window.postMessage(
      {
        type: 'idea-handoff',
        handoffId: requestedHandoffId,
        payload: response.payload,
      },
      window.location.origin,
    );
  } catch (_error) {
    // Ignore one-off handoff failures in the content script and let the page show its own error state.
  }
}
