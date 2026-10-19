import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { Media, Post, PostInput, Series, SeriesInput } from "./types";
import { AppError, parseInput, postSchema, seriesSchema } from "./validation";
import { seedPosts, seedSeries } from "./seed";

type Row = Record<string, string | number | null>;
export class Repository {
  readonly db: DatabaseSync;
  constructor(path: string, seed = true) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db
      .exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS series (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
      CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, excerpt TEXT NOT NULL, body_markdown TEXT NOT NULL, cover_url TEXT NOT NULL DEFAULT '', cover_alt TEXT NOT NULL DEFAULT '', tags TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL CHECK(status IN ('draft','published')), visibility TEXT NOT NULL CHECK(visibility IN ('public','private')), series_id TEXT REFERENCES series(id) ON DELETE SET NULL, series_order INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT, revision INTEGER NOT NULL DEFAULT 1);
      CREATE INDEX IF NOT EXISTS posts_public ON posts(status, visibility, published_at);
      CREATE INDEX IF NOT EXISTS posts_series ON posts(series_id, series_order);
      CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, filename TEXT NOT NULL, original_name TEXT NOT NULL, alt TEXT NOT NULL, caption TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, byte_size INTEGER NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS login_attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);`);
    if (
      seed &&
      !this.db.prepare("SELECT value FROM settings WHERE key = ?").get("seeded")
    ) {
      this.transaction(() => {
        for (const s of seedSeries)
          this.db
            .prepare("INSERT INTO series VALUES (?,?,?,?,?,?,?)")
            .run(
              s.id,
              s.name,
              s.slug,
              s.description,
              s.createdAt,
              s.updatedAt,
              s.revision,
            );
        for (const p of seedPosts) this.insertPost(p);
        this.db.prepare("INSERT INTO settings VALUES (?,?)").run("seeded", "1");
      });
    }
  }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
  private insertPost(p: Post) {
    this.db
      .prepare("INSERT INTO posts VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.bodyMarkdown,
        p.coverUrl,
        p.coverAlt,
        JSON.stringify(p.tags),
        p.status,
        p.visibility,
        p.seriesId,
        p.seriesOrder,
        p.createdAt,
        p.updatedAt,
        p.publishedAt,
        p.revision,
      );
  }
  private post(row: Row | undefined): Post | null {
    if (!row) return null;
    return {
      id: String(row.id),
      title: String(row.title),
      slug: String(row.slug),
      excerpt: String(row.excerpt),
      bodyMarkdown: String(row.body_markdown),
      coverUrl: String(row.cover_url),
      coverAlt: String(row.cover_alt),
      tags: JSON.parse(String(row.tags)),
      status: row.status as Post["status"],
      visibility: row.visibility as Post["visibility"],
      seriesId: row.series_id as string | null,
      seriesOrder: row.series_order as number | null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      publishedAt: row.published_at as string | null,
      revision: Number(row.revision),
    };
  }
  private series(row: Row | undefined): Series | null {
    return row
      ? {
          id: String(row.id),
          name: String(row.name),
          slug: String(row.slug),
          description: String(row.description),
          createdAt: String(row.created_at),
          updatedAt: String(row.updated_at),
          revision: Number(row.revision),
        }
      : null;
  }
  listPosts(publicOnly = false): Post[] {
    return (
      this.db
        .prepare(
          `SELECT * FROM posts ${publicOnly ? "WHERE status = 'published' AND visibility = 'public'" : ""} ORDER BY COALESCE(published_at,created_at) DESC`,
        )
        .all() as Row[]
    ).map((r) => this.post(r)!);
  }
  getPost(id: string) {
    return this.post(
      this.db.prepare("SELECT * FROM posts WHERE id = ?").get(id) as
        Row | undefined,
    );
  }
  getPostBySlug(slug: string, publicOnly = true) {
    return this.post(
      this.db
        .prepare(
          `SELECT * FROM posts WHERE slug = ? ${publicOnly ? "AND status = 'published' AND visibility = 'public'" : ""}`,
        )
        .get(slug) as Row | undefined,
    );
  }
  listSeries(): Series[] {
    return (
      this.db
        .prepare("SELECT * FROM series ORDER BY updated_at DESC")
        .all() as Row[]
    ).map((r) => this.series(r)!);
  }
  getSeries(id: string) {
    return this.series(
      this.db.prepare("SELECT * FROM series WHERE id = ?").get(id) as
        Row | undefined,
    );
  }
  getSeriesBySlug(slug: string) {
    return this.series(
      this.db.prepare("SELECT * FROM series WHERE slug = ?").get(slug) as
        Row | undefined,
    );
  }
  seriesPosts(id: string, publicOnly = false): Post[] {
    return (
      this.db
        .prepare(
          `SELECT * FROM posts WHERE series_id = ? ${publicOnly ? "AND status = 'published' AND visibility = 'public'" : ""} ORDER BY series_order, created_at`,
        )
        .all(id) as Row[]
    ).map((r) => this.post(r)!);
  }
  private normalizeSeries(id: string | null) {
    if (!id) return;
    const posts = this.seriesPosts(id);
    posts.forEach((p, index) =>
      this.db
        .prepare("UPDATE posts SET series_order = ? WHERE id = ?")
        .run(index, p.id),
    );
    this.db
      .prepare(
        "UPDATE series SET revision = revision + 1, updated_at = ? WHERE id = ?",
      )
      .run(new Date().toISOString(), id);
  }
  savePost(raw: PostInput, id?: string): Post {
    const input = parseInput(postSchema, raw);
    return this.transaction(() => {
      const old = id ? this.getPost(id) : null;
      if (id && !old) throw new AppError("게시글을 찾을 수 없습니다.", 404);
      if (old && input.revision !== old.revision)
        throw new AppError(
          "다른 곳에서 수정된 글이에요. 현재 내용을 복사한 뒤 최신 글을 불러와 주세요.",
          409,
        );
      if (input.seriesId && !this.getSeries(input.seriesId))
        throw new AppError("선택한 시리즈를 찾을 수 없습니다.");
      const duplicate = this.db
        .prepare("SELECT id FROM posts WHERE slug = ? AND id != ?")
        .get(input.slug, id ?? "");
      if (duplicate) throw new AppError("이미 사용 중인 게시글 슬러그입니다.");
      const now = new Date().toISOString();
      const moving = old?.seriesId !== input.seriesId;
      const order = input.seriesId
        ? !moving && old
          ? old.seriesOrder
          : this.seriesPosts(input.seriesId).length
        : null;
      const post: Post = {
        ...input,
        id: old?.id ?? randomUUID(),
        seriesOrder: order,
        createdAt: old?.createdAt ?? now,
        updatedAt: now,
        publishedAt:
          input.status === "published"
            ? (old?.publishedAt ?? now)
            : (old?.publishedAt ?? null),
        revision: (old?.revision ?? 0) + 1,
      };
      if (old)
        this.db
          .prepare(
            "UPDATE posts SET title=?,slug=?,excerpt=?,body_markdown=?,cover_url=?,cover_alt=?,tags=?,status=?,visibility=?,series_id=?,series_order=?,updated_at=?,published_at=?,revision=? WHERE id=?",
          )
          .run(
            post.title,
            post.slug,
            post.excerpt,
            post.bodyMarkdown,
            post.coverUrl,
            post.coverAlt,
            JSON.stringify(post.tags),
            post.status,
            post.visibility,
            post.seriesId,
            post.seriesOrder,
            post.updatedAt,
            post.publishedAt,
            post.revision,
            post.id,
          );
      else this.insertPost(post);
      if (moving) this.normalizeSeries(old?.seriesId ?? null);
      if (post.seriesId) this.normalizeSeries(post.seriesId);
      return this.getPost(post.id)!;
    });
  }
  deletePost(id: string, revision?: number) {
    this.transaction(() => {
      const post = this.getPost(id);
      if (!post) throw new AppError("게시글을 찾을 수 없습니다.", 404);
      if (revision !== undefined && revision !== post.revision)
        throw new AppError(
          "게시글이 변경되었습니다. 새로고침 후 다시 시도해 주세요.",
          409,
        );
      this.db.prepare("DELETE FROM posts WHERE id = ?").run(id);
      this.normalizeSeries(post.seriesId);
    });
  }
  saveSeries(raw: SeriesInput, id?: string): Series {
    const input = parseInput(seriesSchema, raw);
    return this.transaction(() => {
      const old = id ? this.getSeries(id) : null;
      if (id && !old) throw new AppError("시리즈를 찾을 수 없습니다.", 404);
      if (old && input.revision !== old.revision)
        throw new AppError(
          "시리즈가 변경되었습니다. 새로고침 후 다시 시도해 주세요.",
          409,
        );
      if (
        this.db
          .prepare("SELECT id FROM series WHERE slug = ? AND id != ?")
          .get(input.slug, id ?? "")
      )
        throw new AppError("이미 사용 중인 시리즈 슬러그입니다.");
      const now = new Date().toISOString();
      const series: Series = {
        id: old?.id ?? randomUUID(),
        name: input.name,
        slug: input.slug,
        description: input.description,
        createdAt: old?.createdAt ?? now,
        updatedAt: now,
        revision: (old?.revision ?? 0) + 1,
      };
      if (input.postIds && new Set(input.postIds).size !== input.postIds.length)
        throw new AppError("같은 게시글을 중복으로 추가할 수 없습니다.");
      for (const postId of input.postIds ?? []) {
        const p = this.getPost(postId);
        if (!p) throw new AppError("추가할 게시글을 찾을 수 없습니다.");
        if (p.seriesId && p.seriesId !== series.id)
          throw new AppError(
            "다른 시리즈에 연결된 게시글입니다. 글 편집에서 시리즈를 변경해 주세요.",
          );
      }
      if (old)
        this.db
          .prepare(
            "UPDATE series SET name=?,slug=?,description=?,updated_at=?,revision=? WHERE id=?",
          )
          .run(
            series.name,
            series.slug,
            series.description,
            series.updatedAt,
            series.revision,
            series.id,
          );
      else
        this.db
          .prepare("INSERT INTO series VALUES (?,?,?,?,?,?,?)")
          .run(
            series.id,
            series.name,
            series.slug,
            series.description,
            series.createdAt,
            series.updatedAt,
            series.revision,
          );
      if (input.postIds) {
        const oldIds = this.seriesPosts(series.id).map((p) => p.id);
        for (const removed of oldIds.filter((p) => !input.postIds!.includes(p)))
          this.db
            .prepare(
              "UPDATE posts SET series_id=NULL,series_order=NULL,revision=revision+1,updated_at=? WHERE id=?",
            )
            .run(now, removed);
        input.postIds.forEach((p, index) =>
          this.db
            .prepare(
              "UPDATE posts SET series_id=?,series_order=?,revision=revision+1,updated_at=? WHERE id=?",
            )
            .run(series.id, index, now, p),
        );
      }
      return this.getSeries(series.id)!;
    });
  }
  deleteSeries(id: string, revision?: number) {
    this.transaction(() => {
      const series = this.getSeries(id);
      if (!series) throw new AppError("시리즈를 찾을 수 없습니다.", 404);
      if (revision !== undefined && revision !== series.revision)
        throw new AppError(
          "시리즈가 변경되었습니다. 새로고침 후 다시 시도해 주세요.",
          409,
        );
      this.db
        .prepare(
          "UPDATE posts SET series_id=NULL,series_order=NULL,revision=revision+1,updated_at=? WHERE series_id=?",
        )
        .run(new Date().toISOString(), id);
      this.db.prepare("DELETE FROM series WHERE id=?").run(id);
    });
  }
  addMedia(media: Media) {
    this.db
      .prepare("INSERT INTO media VALUES (?,?,?,?,?,?,?,?,?)")
      .run(
        media.id,
        media.filename,
        media.originalName,
        media.alt,
        media.caption,
        media.width,
        media.height,
        media.byteSize,
        media.createdAt,
      );
    return media;
  }
  getMedia(id: string): Media | null {
    const row = this.db.prepare("SELECT * FROM media WHERE id=?").get(id) as
      Row | undefined;
    return row
      ? {
          id: String(row.id),
          filename: String(row.filename),
          originalName: String(row.original_name),
          alt: String(row.alt),
          caption: String(row.caption),
          width: Number(row.width),
          height: Number(row.height),
          byteSize: Number(row.byte_size),
          createdAt: String(row.created_at),
        }
      : null;
  }
  listMedia() {
    return (
      this.db
        .prepare("SELECT id FROM media ORDER BY created_at DESC")
        .all() as Row[]
    ).map((row) => this.getMedia(String(row.id))!);
  }
  deleteMedia(id: string) {
    const asset = this.getMedia(id);
    if (!asset) throw new AppError("이미지를 찾을 수 없습니다.", 404);
    const url = `/api/media/${id}`;
    if (
      this.listPosts().some(
        (p) => p.coverUrl === url || p.bodyMarkdown.includes(url),
      )
    )
      throw new AppError(
        "게시글에서 사용 중인 이미지입니다. 글에서 제거한 뒤 삭제해 주세요.",
        409,
      );
    this.db.prepare("DELETE FROM media WHERE id=?").run(id);
    return asset;
  }
  mediaIsPublic(id: string) {
    const url = `/api/media/${id}`;
    return this.listPosts(true).some(
      (p) => p.coverUrl === url || p.bodyMarkdown.includes(url),
    );
  }
  close() {
    this.db.close();
  }
}
// The database and uploads belong to runtime storage, outside the build bundle.
export const dataDirectory = () =>
  resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || "./data");
const globalDb = globalThis as unknown as { portfolioRepository?: Repository };
export function repository() {
  return (globalDb.portfolioRepository ??= new Repository(
    resolve(dataDirectory(), "portfolio.sqlite"),
  ));
}
