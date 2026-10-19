import { repository } from "@/lib/repository";
import { renderCv } from "@/lib/cv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const content = repository().getHome();
  const bytes = await renderCv(content);
  const name = `${content.intro.profile.name} CV.pdf`;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cv.pdf"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
