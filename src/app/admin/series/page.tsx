import { requireOwnerPage } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { SeriesManager } from "@/components/series-manager";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requireOwnerPage();
  const db = repository();
  return (
    <SeriesManager initialSeries={db.listSeries()} posts={db.listPosts()} />
  );
}
