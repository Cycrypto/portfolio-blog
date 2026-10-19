import { repository } from "@/lib/repository";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { SeriesCard } from "@/components/content";
import { EmptyState } from "@/components/ui";
export const dynamic = "force-dynamic";
export const metadata = { title: "Series" };
export default function SeriesPage() {
  const repo = repository();
  const series = repo
    .listSeries()
    .map((s) => ({ ...s, count: repo.seriesPosts(s.id, true).length }))
    .filter((s) => s.count);
  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto max-w-[1248px] px-6 py-14 md:px-16 md:py-18"
      >
        <p className="mb-4 font-mono text-xs tracking-widest text-accent">
          CONNECTED STORIES
        </p>
        <h1 className="mb-5 font-display text-5xl md:text-[64px]">Series.</h1>
        <p className="mb-14 text-base text-muted">
          한 이야기를 이어가는 여러 개의 기록.
        </p>
        {series.length ? (
          <div className="grid gap-x-12 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            {series.map((s) => (
              <SeriesCard key={s.id} series={s} count={s.count} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 공개된 시리즈가 없어요."
            description="이어서 읽을 수 있는 기록을 준비하고 있습니다."
          />
        )}
      </main>
      <div className="mx-auto max-w-[1248px] px-6 md:px-16">
        <SiteFooter />
      </div>
    </>
  );
}
