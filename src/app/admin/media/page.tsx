import { requireOwnerPage } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { MediaManager } from "@/components/media-manager";
export const dynamic = "force-dynamic";
export default async function MediaPage() {
  await requireOwnerPage();
  return <MediaManager initialMedia={repository().listMedia()} />;
}
