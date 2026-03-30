import { buildResumeSnapshot } from '@/lib/portfolio/build-resume-snapshot';
import { renderResumePdf } from '@/lib/portfolio/resume-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const snapshot = await buildResumeSnapshot();
    const pdf = await renderResumePdf(snapshot);

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="park-junha-resume-ko.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to generate resume PDF:', error);
    return new Response('Failed to generate resume PDF', { status: 500 });
  }
}
