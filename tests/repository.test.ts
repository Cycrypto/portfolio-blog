import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Repository } from "../src/lib/repository";
import { AppError } from "../src/lib/validation";
import { defaultHome } from "../src/data/portfolio";
const fails = (status: number) => (error: unknown) =>
  error instanceof AppError && error.status === status;
test("Pencil default is stored in SQLite and edits survive reopening", () => {
  const folder = mkdtempSync(join(tmpdir(), "portfolio-home-"));
  const path = join(folder, "home.sqlite");
  let repo = new Repository(path);
  try {
    const initial = repo.getHomeDocument();
    assert.deepEqual(initial.content, defaultHome);
    const content = structuredClone(initial.content);
    content.intro.title = "수정한 메인 화면";
    content.education.items[0].degree = "수정한 학력";
    content.contact.channels[0].value = "admin@example.com";
    const saved = repo.saveHome(
      { content, revision: initial.revision },
      "admin@example.com",
    );
    assert.equal(saved.revision, 2);
    repo.close();
    repo = new Repository(path);
    assert.deepEqual(repo.getHomeDocument(), saved);
    assert.equal(
      repo.db.prepare("SELECT updated_by FROM home_content").get()?.updated_by,
      "admin@example.com",
    );
  } finally {
    repo.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
test("stale and missing revisions never overwrite newer content", () => {
  const repo = new Repository(":memory:");
  try {
    const initial = repo.getHomeDocument();
    const saved = repo.saveHome(
      {
        ...initial,
        content: {
          ...initial.content,
          footer: { ...initial.content.footer, copyright: "new" },
        },
      },
      "admin",
    );
    assert.throws(() => repo.saveHome(initial, "admin"), fails(409));
    assert.throws(
      () => repo.saveHome({ content: initial.content }, "admin"),
      fails(400),
    );
    assert.deepEqual(repo.getHomeDocument(), saved);
  } finally {
    repo.close();
  }
});
test("invalid nested content and unsafe URLs are rejected atomically", () => {
  const repo = new Repository(":memory:");
  try {
    const initial = repo.getHomeDocument();
    for (const href of [
      "javascript:alert(1)",
      "//evil.example/a",
      "/\\evil.example/a",
      "data:text/html,evil",
    ]) {
      const content = structuredClone(initial.content);
      content.intro.profile.downloadCv.href = href;
      assert.throws(
        () => repo.saveHome({ ...initial, content }, "admin"),
        fails(400),
      );
    }
    const content = structuredClone(initial.content);
    content.experience.companies[0].roles = [];
    assert.throws(
      () => repo.saveHome({ ...initial, content }, "admin"),
      fails(400),
    );
    assert.deepEqual(repo.getHomeDocument(), initial);
  } finally {
    repo.close();
  }
});
test("migration removes retired tables and sessions, keeps saved intro, and is repeatable", () => {
  const folder = mkdtempSync(join(tmpdir(), "portfolio-migrate-"));
  const path = join(folder, "home.sqlite");
  const old = new DatabaseSync(path);
  old.exec(
    "CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE series(id TEXT PRIMARY KEY); CREATE TABLE posts(id TEXT,series_id TEXT REFERENCES series(id)); CREATE TABLE media(id TEXT); CREATE TABLE sessions(token_hash TEXT); CREATE TABLE login_attempts(key TEXT);",
  );
  old.prepare("INSERT INTO settings VALUES('intro',?)").run(
    JSON.stringify({
      name: "박준하",
      eyebrow: "개발자",
      headline: "이전 소개",
      description: "이전 설명",
    }),
  );
  old.close();
  let repo = new Repository(path);
  try {
    assert.equal(repo.getHome().intro.title, "이전 소개");
    assert.equal(repo.getHome().intro.profile.name, "박준하");
    assert.deepEqual(
      repo.db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all()
        .map((row) => row.name),
      ["home_content"],
    );
    const initial = repo.getHomeDocument();
    repo.close();
    repo = new Repository(path);
    assert.deepEqual(repo.getHomeDocument(), initial);
  } finally {
    repo.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
test("an existing full home document migrates without losing content", () => {
  const folder = mkdtempSync(join(tmpdir(), "portfolio-full-migrate-"));
  const path = join(folder, "home.sqlite");
  const old = new DatabaseSync(path);
  old.exec("CREATE TABLE settings(key TEXT PRIMARY KEY,value TEXT NOT NULL)");
  const content = structuredClone(defaultHome);
  content.about.description = "저장된 소개";
  old
    .prepare("INSERT INTO settings VALUES('home',?)")
    .run(JSON.stringify(content));
  old.close();
  const repo = new Repository(path);
  try {
    assert.deepEqual(repo.getHome(), content);
  } finally {
    repo.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
