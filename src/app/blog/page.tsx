import { Suspense } from "react";
import { repository } from "@/lib/repository";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { Journal } from "@/components/journal";
export const dynamic = "force-dynamic";
export const metadata = { title: "Journal" };
export default function BlogPage() {
  const repo = repository();
  const posts = repo.listPosts(true);
  const series = repo
    .listSeries()
    .map((s) => ({ ...s, count: repo.seriesPosts(s.id, true).length }))
    .filter((s) => s.count);
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto max-w-[1248px] px-6 py-10 md:px-16 md:py-18"
      >
        <header className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="mb-4 font-mono text-[10px] tracking-widest text-accent md:text-xs">
              NOTES ON BUILDING & LEARNING
            </p>
            <h1 className="mb-5 font-display text-5xl md:text-[64px]">
              Journal.
            </h1>
            <p className="text-base leading-relaxed text-muted md:text-[17px]">
              만드는 과정과 그 안에서 배운 것들을 기록합니다.
            </p>
          </div>
          <p className="hidden shrink-0 text-right text-sm leading-loose text-muted md:block">
            {posts.length} notes
            <br />
            <span className="font-mono text-xs">{series.length} series</span>
          </p>
        </header>
        <Suspense fallback={<p>글을 불러오고 있습니다.</p>}>
          <Journal posts={posts} series={series} />
        </Suspense>
      </main>
      <div className="mx-auto max-w-[1248px] px-6 md:px-16">
        <SiteFooter />
      </div>
    </>
  );
}
