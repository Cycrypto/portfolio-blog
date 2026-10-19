import { notFound } from "next/navigation";
import { requireOwnerPage } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { SeriesEditor } from "@/components/series-manager";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwnerPage();
  const { id } = await params;
  const db = repository();
  const series = id === "new" ? null : db.getSeries(id);
  if (id !== "new" && !series) notFound();
  return (
    <SeriesEditor
      key={series ? `${series.id}:${series.revision}` : "new"}
      initialSeries={series}
      posts={db.listPosts()}
    />
  );
}
