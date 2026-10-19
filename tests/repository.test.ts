import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Repository } from "../src/lib/repository";
import { AppError } from "../src/lib/validation";
import { headingsFromMarkdown } from "../src/lib/format";
import type { PostInput } from "../src/lib/types";
const input = (
  slug: string,
  overrides: Partial<PostInput> = {},
): PostInput => ({
  title: slug,
  slug,
  excerpt: "요약",
  bodyMarkdown: "## 제목\n\n내용",
  coverUrl: "",
  coverAlt: "",
  tags: [],
  status: "draft",
  visibility: "public",
  seriesId: null,
  ...overrides,
});
const fails = (status: number) => (error: unknown) =>
  error instanceof AppError && error.status === status;
test("posts survive closing and reopening the database", () => {
  const folder = mkdtempSync(join(tmpdir(), "portfolio-repo-"));
  let db = new Repository(join(folder, "db.sqlite"), false);
  try {
    const p = db.savePost(input("persistent"));
    db.close();
    db = new Repository(join(folder, "db.sqlite"), false);
    assert.equal(db.getPost(p.id)?.bodyMarkdown, p.bodyMarkdown);
    db.deletePost(p.id, p.revision);
    assert.equal(db.getPost(p.id), null);
  } finally {
    db.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
test("only published public posts appear in public queries", () => {
  const db = new Repository(":memory:", false);
  try {
    db.savePost(input("draft"));
    db.savePost(
      input("private", { status: "published", visibility: "private" }),
    );
    const p = db.savePost(input("visible", { status: "published" }));
    assert.deepEqual(
      db.listPosts(true).map((p) => p.id),
      [p.id],
    );
    assert.equal(db.getPostBySlug("private"), null);
    assert.equal(db.getPostBySlug("draft"), null);
  } finally {
    db.close();
  }
});
test("stale edits and deletes cannot overwrite the latest revision", () => {
  const db = new Repository(":memory:", false);
  try {
    const p = db.savePost(input("versioned"));
    const updated = db.savePost({ ...p, title: "최신 제목" }, p.id);
    assert.throws(
      () => db.savePost({ ...p, title: "오래된 제목" }, p.id),
      fails(409),
    );
    assert.throws(() => db.deletePost(p.id, p.revision), fails(409));
    assert.equal(db.getPost(p.id)?.title, updated.title);
  } finally {
    db.close();
  }
});
test("duplicate slugs and invalid publication input roll back safely", () => {
  const db = new Repository(":memory:", false);
  try {
    db.savePost(input("same"));
    assert.throws(() => db.savePost(input("same")), fails(400));
    assert.throws(
      () =>
        db.savePost(input("empty", { status: "published", bodyMarkdown: "" })),
      fails(400),
    );
    assert.throws(
      () =>
        db.savePost(
          input("bad-image", {
            coverUrl: "javascript:alert(1)",
            coverAlt: "test",
          }),
        ),
      fails(400),
    );
    assert.throws(
      () =>
        db.savePost(input("no-alt", { coverUrl: "https://example.com/a.png" })),
      fails(400),
    );
    assert.equal(db.listPosts().length, 1);
  } finally {
    db.close();
  }
});
test("series ordering, removal and deletion preserve posts", () => {
  const db = new Repository(":memory:", false);
  try {
    const s = db.saveSeries({ name: "순서", slug: "ordered", description: "" });
    const a = db.savePost(
      input("first", { seriesId: s.id, status: "published" }),
    );
    const hidden = db.savePost(input("hidden", { seriesId: s.id }));
    const b = db.savePost(
      input("last", { seriesId: s.id, status: "published" }),
    );
    const reordered = db.saveSeries(
      { ...db.getSeries(s.id)!, postIds: [b.id, hidden.id, a.id] },
      s.id,
    );
    assert.deepEqual(
      db.seriesPosts(s.id, true).map((p) => p.id),
      [b.id, a.id],
    );
    const removed = db.saveSeries(
      { ...reordered, postIds: [b.id, a.id] },
      s.id,
    );
    assert.equal(db.getPost(hidden.id)?.seriesId, null);
    assert.deepEqual(
      db.seriesPosts(s.id).map((p) => p.seriesOrder),
      [0, 1],
    );
    db.deleteSeries(s.id, removed.revision);
    assert.equal(db.listPosts().length, 3);
    assert.ok(
      db
        .listPosts()
        .every((p) => p.seriesId === null && p.seriesOrder === null),
    );
  } finally {
    db.close();
  }
});
test("invalid series membership leaves metadata and order unchanged", () => {
  const db = new Repository(":memory:", false);
  try {
    const a = db.saveSeries({ name: "A", slug: "a", description: "" });
    const b = db.saveSeries({ name: "B", slug: "b", description: "" });
    const post = db.savePost(input("attached", { seriesId: b.id }));
    assert.throws(
      () => db.saveSeries({ ...a, name: "changed", postIds: [post.id] }, a.id),
      fails(400),
    );
    assert.equal(db.getSeries(a.id)?.name, "A");
    assert.equal(db.getPost(post.id)?.seriesId, b.id);
    assert.throws(
      () =>
        db.saveSeries(
          { ...db.getSeries(b.id)!, postIds: [post.id, post.id] },
          b.id,
        ),
      fails(400),
    );
  } finally {
    db.close();
  }
});
test("used images cannot be removed and become public only through public posts", () => {
  const db = new Repository(":memory:", false);
  try {
    const m = {
      id: "photo",
      filename: "photo.webp",
      originalName: "photo.png",
      alt: "사진",
      caption: "",
      width: 10,
      height: 10,
      byteSize: 100,
      createdAt: new Date().toISOString(),
    };
    db.addMedia(m);
    const p = db.savePost(
      input("photo-post", { bodyMarkdown: "![사진](/api/media/photo)" }),
    );
    assert.equal(db.mediaIsPublic(m.id), false);
    assert.throws(() => db.deleteMedia(m.id), fails(409));
    const published = db.savePost({ ...p, status: "published" }, p.id);
    assert.equal(db.mediaIsPublic(m.id), true);
    db.deletePost(p.id, published.revision);
    assert.equal(db.deleteMedia(m.id).id, m.id);
  } finally {
    db.close();
  }
});
test("table of contents ignores fenced headings and disambiguates duplicates", () => {
  assert.deepEqual(
    headingsFromMarkdown(
      "## 같은 제목\n```md\n# 코드 속 제목\n```\n## 같은 제목\n### **중요** [링크](https://example.com)",
    ),
    [
      { id: "같은-제목", text: "같은 제목", level: 2, line: 1 },
      { id: "같은-제목-1", text: "같은 제목", level: 2, line: 5 },
      { id: "중요-링크", text: "중요 링크", level: 3, line: 6 },
    ],
  );
});
test("intro falls back to defaults, persists edits and rejects empty headlines", () => {
  const db = new Repository(":memory:", false);
  try {
    const fallback = db.getIntro();
    assert.equal(fallback.name, "박준하");
    const saved = db.saveIntro({
      eyebrow: " BACKEND ",
      name: "박준하",
      headline: "첫 줄\r\n둘째 줄",
      description: "소개",
    });
    assert.equal(saved.eyebrow, "BACKEND");
    assert.equal(saved.headline, "첫 줄\n둘째 줄");
    assert.deepEqual(db.getIntro(), saved);
    assert.throws(
      () => db.saveIntro({ ...saved, headline: "   " }),
      fails(400),
    );
    assert.deepEqual(db.getIntro(), saved);
    db.db
      .prepare("UPDATE settings SET value = ? WHERE key = 'intro'")
      .run("{broken");
    assert.equal(db.getIntro().name, fallback.name);
  } finally {
    db.close();
  }
});
