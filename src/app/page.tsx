import type { Metadata } from "next";
import { repository } from "@/lib/repository";
import { Portfolio } from "@/components/portfolio";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { intro } = repository().getHome();
  return {
    title: `${intro.profile.name} — 포트폴리오`,
    description: intro.description || intro.title.replace(/\n/g, " "),
  };
}
export default function Page() {
  return <Portfolio content={repository().getHome()} />;
}
