export type SeriesOrder = "publication" | "manual";
export interface SeriesPost {
  id: string;
  title: string;
  status: "published" | "draft" | "scheduled";
  publishedAt: string | null;
}
export interface BlogSeries {
  id: string;
  name: string;
  description: string;
  url: string;
  order: SeriesOrder;
  postIds: string[];
}
export interface SeriesWorkspace {
  revision: string;
  blogUrl: string;
  series: BlogSeries[];
  posts: SeriesPost[];
}

export function byPublication(a: SeriesPost, b: SeriesPost) {
  // Unpublished parts stay at the end until their actual publication date exists.
  const date = (post: SeriesPost) =>
    post.status === "published" && post.publishedAt
      ? Date.parse(post.publishedAt)
      : Infinity;
  const first = date(a),
    second = date(b);
  return (first === second ? 0 : first - second) || a.id.localeCompare(b.id);
}
