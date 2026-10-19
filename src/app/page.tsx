import type { Metadata } from "next";
import { Portfolio } from "@/components/portfolio";
export const dynamic = "force-static";
export const metadata: Metadata = {
  title: "Oliver Rowland — Full Stack Developer",
  description:
    "Building scalable web applications with clean architecture, modern tools, and thoughtful user experience.",
};
export default function Page() {
  return <Portfolio />;
}
