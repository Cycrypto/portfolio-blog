export type PublicationStatus = "draft" | "published";
export type Visibility = "public" | "private";
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyMarkdown: string;
  coverUrl: string;
  coverAlt: string;
  tags: string[];
  status: PublicationStatus;
  visibility: Visibility;
  seriesId: string | null;
  seriesOrder: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  revision: number;
}
export interface Series {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
}
export interface Media {
  id: string;
  filename: string;
  originalName: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
  byteSize: number;
  createdAt: string;
}
export type PostInput = Pick<
  Post,
  | "title"
  | "slug"
  | "excerpt"
  | "bodyMarkdown"
  | "coverUrl"
  | "coverAlt"
  | "tags"
  | "status"
  | "visibility"
  | "seriesId"
> & { revision?: number };
export type SeriesInput = Pick<Series, "name" | "slug" | "description"> & {
  revision?: number;
  postIds?: string[];
};
export const isPublic = (post: Post) =>
  post.status === "published" && post.visibility === "public";
