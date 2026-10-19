import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { buttonClass } from "@/components/ui-styles";
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-[1120px] px-6 py-32 text-center">
        <p className="font-mono text-xs text-accent">404 / NOT FOUND</p>
        <h1 className="my-6 font-heading text-3xl">페이지를 찾을 수 없어요.</h1>
        <p className="mb-8 text-muted">
          주소를 확인하거나 메인 화면으로 돌아가 주세요.
        </p>
        <Link href="/" className={buttonClass()}>
          포트폴리오로 돌아가기
        </Link>
      </main>
      <div className="px-6">
        <SiteFooter />
      </div>
    </>
  );
}
