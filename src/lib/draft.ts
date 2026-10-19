import type { PostInput, SeriesInput } from "./types";
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, max: number): value is string =>
  typeof value === "string" && value.length <= max;
const revision = (value: unknown) =>
  value === undefined ||
  (typeof value === "number" && Number.isSafeInteger(value) && value > 0);
const strings = (
  value: unknown,
  count: number,
  length: number,
): value is string[] =>
  Array.isArray(value) &&
  value.length <= count &&
  value.every((item) => text(item, length));

export function isPostDraft(value: unknown): value is PostInput {
  return (
    record(value) &&
    text(value.title, 160) &&
    text(value.slug, 100) &&
    text(value.excerpt, 160) &&
    text(value.bodyMarkdown, 1_000_000) &&
    text(value.coverUrl, 2000) &&
    text(value.coverAlt, 300) &&
    strings(value.tags, 12, 32) &&
    (value.status === "draft" || value.status === "published") &&
    (value.visibility === "public" || value.visibility === "private") &&
    (value.seriesId === null || text(value.seriesId, 64)) &&
    revision(value.revision)
  );
}
export function isSeriesDraft(value: unknown): value is SeriesInput {
  return (
    record(value) &&
    text(value.name, 100) &&
    text(value.slug, 100) &&
    text(value.description, 300) &&
    revision(value.revision) &&
    (value.postIds === undefined || strings(value.postIds, 1000, 64))
  );
}
