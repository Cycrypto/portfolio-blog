import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSeriesWorkspace } from "@/lib/series";
import { isAppError } from "@/lib/validation";
import { SeriesManager } from "@/components/admin/series-manager";
export const dynamic = "force-dynamic";
export const metadata = { title: "블로그 시리즈 관리" };

export default async function SeriesPage() {
  let admin;
  try {
    admin = await requireAdmin(undefined, "series:read");
  } catch (error) {
    if (!isAppError(error)) throw error;
    return (
      <main id="main" className="mx-auto max-w-lg px-6 py-32">
        <h1 className="mb-4 font-heading text-2xl">
          관리자 인증을 확인해 주세요.
        </h1>
        <p className="mb-8 text-muted">
          Cloudflare Access에서 관리자 계정으로 로그인한 뒤 다시 접속해 주세요.
        </p>
        <Link href="/admin" className="text-accent underline">
          관리자로 돌아가기
        </Link>
      </main>
    );
  }
  try {
    return (
      <SeriesManager initial={await getSeriesWorkspace()} email={admin.email} />
    );
  } catch (error) {
    if (!isAppError(error)) throw error;
    return (
      <main id="main" className="mx-auto max-w-lg px-6 py-32">
        <h1 className="mb-4 font-heading text-2xl">
          블로그 연결을 확인해 주세요.
        </h1>
        <p role="alert" className="mb-8 leading-relaxed text-muted">
          {error.message}
        </p>
        <div className="flex gap-6">
          <Link href="/admin/series" className="text-accent underline">
            다시 연결
          </Link>
          <Link href="/admin" className="text-accent underline">
            관리자로 돌아가기
          </Link>
        </div>
      </main>
    );
  }
}
