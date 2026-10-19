import { requireAdmin } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { PreviewFrame } from "@/components/admin/preview-frame";
export const dynamic = "force-dynamic";
export const metadata = { title: "메인 화면 미리보기" };
export default async function PreviewPage() {
  await requireAdmin();
  return <PreviewFrame initial={repository().getHome()} />;
}
