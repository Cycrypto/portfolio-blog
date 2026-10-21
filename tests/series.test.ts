import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { GhostAdmin } from "../src/lib/ghost-admin";
import {
  createSeries,
  getSeriesWorkspace,
  saveSeries,
} from "../src/lib/series";
import { AppError } from "../src/lib/validation";
import {
  ghostFixture,
  ghostResponse,
  ghostTestKey,
  fixtureId as id,
} from "./support/ghost-fixture.mjs";
import { seriesOrder } from "../ghost/theme/assets/js/series-order.js";

test("series management preserves Ghost content while supporting publication order, membership, independent order, and conflicts", async (t) => {
  const oldUrl = process.env.GHOST_ADMIN_URL,
    oldKey = process.env.GHOST_ADMIN_API_KEY;
  process.env.GHOST_ADMIN_URL = "https://ghost-test.invalid";
  process.env.GHOST_ADMIN_API_KEY = ghostTestKey;
  t.after(() => {
    if (oldUrl === undefined) delete process.env.GHOST_ADMIN_URL;
    else process.env.GHOST_ADMIN_URL = oldUrl;
    if (oldKey === undefined) delete process.env.GHOST_ADMIN_API_KEY;
    else process.env.GHOST_ADMIN_API_KEY = oldKey;
    mock.restoreAll();
  });
  const state = ghostFixture();
  let failPost = "";
  const origins = new Set<string>();
  mock.method(
    globalThis,
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      origins.add(new URL(String(input)).origin);
      if (failPost && String(input).includes(`posts/${failPost}/`))
        return Response.json({}, { status: 409 });
      return ghostResponse(state, input, init);
    },
  );
  const admin = new GhostAdmin();
  let workspace = await getSeriesWorkspace(admin);
  const series = () => workspace.series.find((series) => series.id === id(1))!;
  const save = (overrides: Record<string, unknown>) =>
    saveSeries(
      { ...series(), revision: workspace.revision, ...overrides },
      admin,
    );
  assert.equal(series().order, "publication");
  assert.deepEqual(series().postIds, [id(101), id(102)]);

  await t.test(
    "private API routing preserves public series links",
    async () => {
      const before = process.env.GHOST_API_URL;
      process.env.GHOST_API_URL = "http://ghost:2368";
      try {
        origins.clear();
        const internal = await getSeriesWorkspace(new GhostAdmin());
        assert.deepEqual([...origins], ["http://ghost:2368"]);
        assert.equal(internal.blogUrl, "https://ghost-test.invalid");
        assert.ok(
          internal.series.every((series) =>
            series.url.startsWith("https://ghost-test.invalid/"),
          ),
        );
      } finally {
        if (before === undefined) delete process.env.GHOST_API_URL;
        else process.env.GHOST_API_URL = before;
      }
    },
  );

  await t.test("create a series with an automatic slug", async () => {
    const created = await createSeries(
      { name: "새 시리즈", description: "소개" },
      admin,
    );
    assert.ok(created.selectedId);
    assert.equal(
      created.series.find((s) => s.id === created.selectedId)?.order,
      "publication",
    );
    workspace = created;
  });
  await t.test(
    "add published posts and drafts in date order without publishing or altering existing tags",
    async () => {
      workspace = await save({ postIds: [id(104), id(103), id(102), id(101)] });
      assert.deepEqual(series().postIds, [id(101), id(102), id(103), id(104)]);
      assert.equal(series().order, "publication");
      assert.equal(
        state.posts.find((post) => post.id === id(104))!.status,
        "draft",
      );
      const first = state.posts.find((post) => post.id === id(101))!;
      assert.deepEqual(
        first.tags.slice(0, 3).map((tag) => tag.id),
        [id(3), id(1), id(2)],
      );
      assert.equal(first.published_at, "2026-10-01T00:00:00.000Z");
    },
  );
  await t.test(
    "manual order matches the public theme and leaves another series independent",
    async () => {
      workspace = await save({
        order: "manual",
        postIds: [id(103), id(101), id(102), id(104)],
      });
      assert.deepEqual(series().postIds, [id(103), id(101), id(102), id(104)]);
      for (const [index, postId] of series().postIds.entries()) {
        const names = state.posts
          .find((post) => post.id === postId)!
          .tags.map((tag) => tag.name)
          .join(" ");
        assert.equal(seriesOrder(names, id(1)), index + 1);
        assert.equal(seriesOrder(names, id(2)), Infinity);
      }
      assert.equal(
        workspace.series.find((s) => s.id === id(2))!.order,
        "publication",
      );
    },
  );
  await t.test(
    "reset ordering and remove a post without deleting it or its unrelated tags",
    async () => {
      workspace = await save({
        name: "서버 이야기",
        description: "새 소개",
        order: "publication",
        postIds: [id(103), id(102), id(104)],
      });
      assert.equal(series().name, "서버 이야기");
      assert.deepEqual(series().postIds, [id(102), id(103), id(104)]);
      assert.equal(series().order, "publication");
      const removed = state.posts.find((post) => post.id === id(101))!;
      assert.deepEqual(
        removed.tags.map((tag) => tag.id),
        [id(3), id(2)],
      );
    },
  );
  await t.test(
    "a newly published draft joins according to its actual publication date",
    async () => {
      const draft = state.posts.find((post) => post.id === id(104))!;
      draft.status = "published";
      draft.published_at = "2026-10-02T12:00:00.000Z";
      workspace = await getSeriesWorkspace(admin);
      assert.deepEqual(series().postIds, [id(102), id(104), id(103)]);
    },
  );
  await t.test(
    "stale revisions and invalid post selections fail before any writes",
    async () => {
      await assert.rejects(
        () => save({ revision: "0".repeat(64) }),
        (e) => e instanceof AppError && e.status === 409,
      );
      await assert.rejects(
        () => save({ postIds: [id(102), id(102)] }),
        (e) => e instanceof AppError && e.status === 400,
      );
      await assert.rejects(
        () => save({ postIds: [id(999999)] }),
        (e) => e instanceof AppError && e.status === 409,
      );
    },
  );
  await t.test(
    "partial saves are reported explicitly and the latest state can be reloaded",
    async () => {
      failPost = id(103);
      await assert.rejects(
        () => save({ order: "manual", postIds: [id(103), id(104), id(102)] }),
        /일부 변경이 반영/,
      );
      failPost = "";
      workspace = await getSeriesWorkspace(admin);
      assert.ok(workspace.revision);
    },
  );
  await t.test(
    "pagination includes posts beyond the first hundred",
    async () => {
      for (let number = 200; number < 305; number++)
        state.posts.push({
          ...structuredClone(state.posts[0]),
          id: id(number),
        });
      workspace = await getSeriesWorkspace(admin);
      assert.equal(workspace.posts.length, 110);
    },
  );
});

test("Ghost connection fails closed when the server key is missing", () => {
  const key = process.env.GHOST_ADMIN_API_KEY;
  delete process.env.GHOST_ADMIN_API_KEY;
  try {
    assert.throws(
      () => new GhostAdmin(),
      (e) => e instanceof AppError && e.status === 503,
    );
  } finally {
    if (key !== undefined) process.env.GHOST_ADMIN_API_KEY = key;
  }
});
