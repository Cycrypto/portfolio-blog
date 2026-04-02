import { buildAdminPortfolioSnapshot } from '@/lib/portfolio/build-admin-portfolio-snapshot';
import { renderAdminPortfolioPdf } from '@/lib/portfolio/admin-portfolio-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api.junha.space'
      : 'http://localhost:3002')
  );
}

async function verifyAdminAccess(authorization: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/stats`, {
      headers: {
        Authorization: authorization,
      },
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const authorization = request.headers.get('authorization');

  if (!authorization) {
    return Response.json(
      { message: '관리자 인증이 필요합니다.' },
      { status: 401 },
    );
  }

  const isAdmin = await verifyAdminAccess(authorization);
  if (!isAdmin) {
    return Response.json(
      { message: '포트폴리오 PDF는 관리자만 생성할 수 있습니다.' },
      { status: 403 },
    );
  }

  try {
    const snapshot = await buildAdminPortfolioSnapshot();
    const pdf = await renderAdminPortfolioPdf(snapshot);

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="park-junha-portfolio-ko.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to generate portfolio PDF:', error);
    return Response.json(
      { message: '포트폴리오 PDF 생성에 실패했습니다.' },
      { status: 500 },
    );
  }
}
