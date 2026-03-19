chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'chatgpt-content-ready') {
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type !== 'extract-chatgpt-conversation') {
    return undefined;
  }

  try {
    const payload = extractConversationPayload();
    sendResponse({ ok: true, payload });
  } catch (error) {
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : '대화 추출에 실패했습니다.',
    });
  }

  return true;
});

function extractConversationPayload() {
  const messageNodes = Array.from(
    document.querySelectorAll('main [data-message-author-role]'),
  );

  if (messageNodes.length === 0) {
    throw new Error('현재 페이지에서 ChatGPT 대화를 찾지 못했습니다.');
  }

  const messages = messageNodes
    .map((node, index) => {
      const role = normalizeRole(node.getAttribute('data-message-author-role'));
      const text = extractMessageText(node);

      return {
        order: index,
        role,
        text,
      };
    })
    .filter((message) => message.text.length > 0);

  if (messages.length === 0) {
    throw new Error('비어 있지 않은 대화 메시지를 찾지 못했습니다.');
  }

  return {
    sourceTitle: extractSourceTitle(messages),
    sourceUrl: window.location.href,
    extractedAt: new Date().toISOString(),
    messages,
  };
}

function extractSourceTitle(messages) {
  const heading = document.querySelector('main h1');
  const headingText = heading?.textContent?.trim();
  if (headingText) {
    return headingText;
  }

  const documentTitle = document.title.replace(/\s*-\s*ChatGPT\s*$/i, '').trim();
  if (documentTitle) {
    return documentTitle;
  }

  return messages.find((message) => message.role === 'user')?.text.slice(0, 60) || 'ChatGPT 대화';
}

function extractMessageText(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('button, svg, textarea, nav, form, [aria-hidden="true"]').forEach((element) => {
    element.remove();
  });

  clone.querySelectorAll('pre').forEach((pre) => {
    const codeText = normalizeWhitespace(pre.innerText || pre.textContent || '');
    const replacement = document.createTextNode(
      codeText ? `\n\`\`\`\n${codeText}\n\`\`\`\n` : '\n',
    );
    pre.replaceWith(replacement);
  });

  clone.querySelectorAll('code').forEach((code) => {
    const inlineCode = normalizeWhitespace(code.textContent || '');
    if (!inlineCode) {
      code.remove();
      return;
    }

    code.replaceWith(document.createTextNode(` ${inlineCode} `));
  });

  const text = normalizeWhitespace(
    (clone.innerText || clone.textContent || '')
      .replace(/Copy code/gi, ' ')
      .replace(/ChatGPT said:/gi, ' ')
      .replace(/You said:/gi, ' '),
  );

  return text;
}

function normalizeRole(role) {
  if (role === 'user' || role === 'assistant') {
    return role;
  }

  return 'unknown';
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}
