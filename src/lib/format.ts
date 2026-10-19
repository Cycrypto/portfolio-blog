import type { Post } from "./types";
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  })
    .format(new Date(value))
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
export const readingMinutes = (text: string) =>
  Math.max(1, Math.ceil(text.replace(/[#*`>\[\]()]/g, "").length / 550));
export const sortPublicPosts = (posts: Post[]) =>
  [...posts].sort((a, b) =>
    (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
  );
export const slugify = (title: string) =>
  title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
    .replace(/^-|-$/g, "");
export const headingSlug = (title: string) =>
  title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-") || "section";
export function headingsFromMarkdown(markdown: string) {
  const result: { id: string; text: string; level: number; line: number }[] =
    [];
  let fence: string | null = null;
  const counts = new Map<string, number>();
  for (const [index, line] of markdown.split("\n").entries()) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
      continue;
    }
    if (fence) continue;
    const match = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
    if (!match) continue;
    const text = match[2]
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*`_~]/g, "");
    const base = headingSlug(text);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    result.push({
      id: count ? `${base}-${count}` : base,
      text,
      level: match[1].length,
      line: index + 1,
    });
  }
  return result;
}
