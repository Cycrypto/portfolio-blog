import { TokenManager } from '@/lib/auth/token-manager';

function getErrorMessage(body: string): string {
  try {
    const parsed = JSON.parse(body) as { message?: string };
    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }
  } catch {
    return body.trim() || '포트폴리오 PDF 다운로드에 실패했습니다.';
  }

  return body.trim() || '포트폴리오 PDF 다운로드에 실패했습니다.';
}

export async function downloadPortfolioPdf(): Promise<void> {
  const authorization = TokenManager.getAuthorizationHeader();

  if (!authorization) {
    throw new Error('관리자 로그인이 필요합니다.');
  }

  const response = await fetch('/api/portfolio', {
    method: 'GET',
    headers: {
      Authorization: authorization,
    },
  });

  if (!response.ok) {
    throw new Error(getErrorMessage(await response.text()));
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = 'park-junha-portfolio-ko.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}
