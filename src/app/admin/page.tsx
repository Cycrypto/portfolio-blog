import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { isAppError } from "@/lib/validation";
import { HomeEditor } from "@/components/admin/home-editor";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (!isAppError(error)) throw error;
    return (
      <main id="main" className="mx-auto max-w-lg px-6 py-32">
        <p className="mb-4 font-mono text-xs text-accent">CLOUDFLARE ACCESS</p>
        <h1 className="mb-4 font-heading text-2xl">
          {error.status === 503
            ? "관리자 인증 설정이 필요합니다."
            : "관리자 인증을 확인해 주세요."}
        </h1>
        <p className="mb-8 leading-relaxed text-muted">
          {error.status === 503
            ? "Cloudflare Access를 연결한 후 홈 화면을 편집할 수 있습니다."
            : "Cloudflare Access에서 관리자 계정으로 로그인한 뒤 다시 접속해 주세요."}
        </p>
        <Link href="/" className="text-accent underline">
          포트폴리오로 돌아가기
        </Link>
      </main>
    );
  }
  return (
    <HomeEditor initial={repository().getHomeDocument()} email={admin.email} />
  );
}
