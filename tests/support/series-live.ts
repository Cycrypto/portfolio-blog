// Run only against a disposable, fresh local Ghost. Never an existing blog.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { GhostAdmin, type GhostPost } from "../../src/lib/ghost-admin";
import {
  createSeries,
  getSeriesWorkspace,
  saveSeries,
} from "../../src/lib/series";

const site = process.env.SERIES_QA_URL || "http://127.0.0.1:13002";
if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(site).hostname))
  throw new Error("Live series verification requires a disposable local Ghost");
let cookie = "";
async function session(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`${site}/ghost/api/admin/${path}`, {
    method,
    headers: {
      Origin: site,
      Cookie: cookie,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.headers.getSetCookie().length)
    cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; ");
  if (!response.ok)
    throw new Error(`Ghost QA ${method} ${path}: ${response.status}`);
  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : {};
}
async function main() {
  const setup = await session("authentication/setup/");
  if (setup.setup[0].status)
    throw new Error(
      "Refusing to run against a configured Ghost. Start a fresh disposable container.",
    );
  const password = randomBytes(24).toString("hex");
  await session("authentication/setup/", "POST", {
    setup: [
      {
        name: "QA",
        email: "series-qa@example.com",
        password,
        blogTitle: "Series QA",
      },
    ],
  });
  await session("session/", "POST", {
    username: "series-qa@example.com",
    password,
  });
  await session("themes/junha/activate/", "PUT");
  const integration = await session("integrations/", "POST", {
    integrations: [{ name: "Series QA" }],
  });
  const key = integration.integrations[0].api_keys.find(
    (key: { type: string }) => key.type === "admin",
  );
  assert.ok(key, "Integration must provide an Admin API key");
  process.env.GHOST_ADMIN_URL = site;
  process.env.GHOST_ADMIN_API_KEY = key.secret.includes(":")
    ? key.secret
    : `${key.id}:${key.secret}`;
  const admin = new GhostAdmin();
  const created = await createSeries(
    { name: "홈서버 구축", description: "실제 Ghost 연동 확인" },
    admin,
  );
  const selectedId = created.selectedId!;
  const postIds: string[] = [];
  for (const [index, title] of [
    "서버 준비",
    "Docker 설치",
    "서비스 배포",
  ].entries()) {
    const result = await admin.request<GhostPost>(
      "posts/?source=html",
      "POST",
      {
        posts: [
          {
            title,
            html: "<p>시리즈 관리 연동 확인</p>",
            status: "published",
            published_at: `2026-10-0${index + 1}T00:00:00.000Z`,
            tags: [{ name: "인프라" }],
          },
        ],
      },
    );
    postIds.push(result.posts![0].id);
  }
  const draft = await admin.request<GhostPost>("posts/?source=html", "POST", {
    posts: [{ title: "백업 설정", html: "<p>초안</p>", status: "draft" }],
  });
  const draftId = draft.posts![0].id;
  let workspace = await getSeriesWorkspace(admin);
  const currentSeries = () =>
    workspace.series.find((series) => series.id === selectedId)!;
  const save = (order: "publication" | "manual", ids: string[]) =>
    saveSeries(
      { ...currentSeries(), order, postIds: ids, revision: workspace.revision },
      admin,
    );
  workspace = await save("publication", [draftId, ...[...postIds].reverse()]);
  assert.deepEqual(currentSeries().postIds, [...postIds, draftId]);
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  });
  try {
    const page = await browser.newPage();
    const publicSeries = currentSeries().url;
    async function publicOrder(expected: string[]) {
      await page.goto(publicSeries);
      await page.waitForFunction(
        () => document.querySelectorAll("[data-series-number]").length > 0,
      );
      const actual = await page
        .locator("[data-series-item]")
        .evaluateAll((items) =>
          items.map((item) => item.getAttribute("data-series-id")),
        );
      assert.deepEqual(actual, expected);
    }
    await publicOrder(postIds);
    workspace = await save("manual", [
      postIds[2],
      postIds[0],
      draftId,
      postIds[1],
    ]);
    await publicOrder([postIds[2], postIds[0], postIds[1]]);
    const posts = await admin.browse<GhostPost>("posts", {
      include: "tags",
      filter: "status:[draft,published,scheduled]",
    });
    const first = posts.find((post) => post.id === postIds[0])!;
    assert.equal(first.title, "서버 준비");
    assert.equal(first.tags[0].name, "인프라");
    assert.equal(posts.find((post) => post.id === draftId)!.status, "draft");
    await page.locator(`[data-series-id="${postIds[0]}"] a`).click();
    await page.waitForSelector("[data-series-progress]");
    assert.equal(
      await page.locator("[data-series-progress]").innerText(),
      "2 / 3",
    );
    assert.equal(
      await page
        .locator(
          '[data-series-navigation] [rel="prev"] .series-navigation__title',
        )
        .innerText(),
      "서비스 배포",
    );
    assert.equal(
      await page
        .locator(
          '[data-series-navigation] [rel="next"] .series-navigation__title',
        )
        .innerText(),
      "Docker 설치",
    );
    workspace = await save("publication", postIds);
    await publicOrder(postIds);
    console.log(
      "Live Ghost passed: create, add, publication order, manual order, reset, drafts, preserved tags, public archive, contents and adjacent links.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
