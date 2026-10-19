import type { Metadata } from "next";
import { repository } from "@/lib/repository";
import { Portfolio } from "@/components/portfolio";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const intro = repository().getIntro();
  return {
    title: `${intro.name} — 포트폴리오`,
    description: intro.description || intro.headline.replace(/\n/g, " "),
  };
}
export default function Page() {
  return <Portfolio intro={repository().getIntro()} />;
}
