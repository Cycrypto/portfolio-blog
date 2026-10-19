import { requireOwnerPage } from "@/lib/auth";
import { repository } from "@/lib/repository";
import { IntroEditor } from "@/components/intro-editor";
export const dynamic = "force-dynamic";
export const metadata = { title: "소개 편집" };
export default async function Page() {
  await requireOwnerPage();
  return <IntroEditor initial={repository().getIntro()} />;
}
