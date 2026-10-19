import { test, expect } from "@playwright/test";
import type { Post, Series } from "../../src/lib/types";
const password = "test-portfolio-password";
test("reference portfolio, journal and mobile navigation render without overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /hydrat/i.test(m.text())) errors.push(m.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Full Stack Developer",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Oliver Rowland", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#experience")).toContainText("Northstack");
  await expect(page.locator("#contact")).toContainText("Let’s Connect");
  await page.screenshot({
    path: "test-results/portfolio-desktop.png",
    fullPage: true,
  });
  await page.goto("/blog");
  await expect(page.getByRole("heading", { name: "Journal." })).toBeVisible();
  await page.screenshot({
    path: "test-results/blog-desktop.png",
    fullPage: true,
  });
  await page.locator("article a").first().click();
  await expect(page).toHaveURL(/\/blog\/[^/]+$/);
  await page.reload();
  await expect(page.locator(".prose")).toBeVisible();
  await expect(page.locator(".prose h2").first()).toHaveAttribute("id", /.+/);
  expect(
    await page.locator("aside nav a").evaluateAll((links) =>
      links.every((link) => {
        const a = link as HTMLAnchorElement;
        const heading = document.getElementById(
          decodeURIComponent(a.hash.slice(1)),
        );
        return heading?.textContent === a.textContent;
      }),
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/article-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const articleUrl = page.url();
  for (const url of ["/", "/blog", "/series", articleUrl]) {
    await page.goto(url);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/blog");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page
    .getByRole("navigation", { name: "모바일 내비게이션" })
    .getByRole("link", { name: "시리즈", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Series." })).toBeVisible();
  await page.screenshot({
    path: "test-results/series-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("anonymous users cannot mutate content or read drafts; cross-origin writes are rejected", async ({
  request,
}) => {
  expect((await request.post("/api/posts", { data: {} })).status()).toBe(401);
  expect((await request.post("/api/series", { data: {} })).status()).toBe(401);
  expect((await request.get("/api/media")).status()).toBe(401);
  expect(
    (
      await request.post("/api/auth", {
        headers: { Origin: "https://untrusted.example" },
        data: { password },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.delete("/api/auth", {
        headers: { Origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post("/api/auth", { data: { password: "incorrect" } })
    ).status(),
  ).toBe(401);
  const posts = (await (await request.get("/api/posts")).json()) as Post[];
  expect(
    posts.every((p) => p.status === "published" && p.visibility === "public"),
  ).toBe(true);
});
test("owner writes Markdown, uploads an image, publishes, edits, manages series and deletes", async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const title = `검증 기록 ${stamp}`;
  const slug = `e2e-post-${stamp}`;
  const seriesName = `검증 시리즈 ${stamp}`;
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("관리자 비밀번호", { exact: true }).fill(password);
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "게시글 관리" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "새 게시글", exact: true }).click();
  await page.getByLabel("게시글 제목", { exact: true }).fill(title);
  await page.getByLabel("URL 슬러그", { exact: true }).fill(slug);
  await page
    .getByLabel("Markdown 본문")
    .fill(
      "## 검증 제목\n\n**굵은 글씨**와 [링크](https://example.com).\n\n> 인용문\n\n```typescript\nconst value = 42;\n```\n\n| 제목 | 값 |\n| --- | --- |\n| A | 1 |\n\n- [x] 완료\n\n<script>window.untrusted=true</script>",
    );
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(page.getByText("모든 변경 사항 저장됨")).toBeVisible();
  const postId = page.url().split("/").pop()!;
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  expect(
    (await publicPage.goto(`http://127.0.0.1:3001/blog/${slug}`))?.status(),
  ).toBe(404);
  await page.getByRole("button", { name: "이미지 삽입", exact: true }).click();
  const dialog = page.locator("dialog[open]");
  await dialog
    .locator("input[type=file]")
    .setInputFiles("public/portfolio/illustration-intro.png");
  await dialog.getByLabel("대체 텍스트 · 필수").fill("검증용 주황색 일러스트");
  await dialog.getByLabel("캡션 · 선택").fill("원본 비율을 유지하는 사진");
  await dialog
    .getByRole("button", { name: "이미지 업로드", exact: true })
    .click();
  await dialog.getByRole("button", { name: "본문에 삽입" }).click();
  await page.getByRole("button", { name: "발행하기", exact: true }).click();
  await page
    .locator("dialog[open]")
    .getByRole("button", { name: "발행하기", exact: true })
    .click();
  await expect(page.getByText("모든 변경 사항 저장됨")).toBeVisible();
  const current = (await (
    await page.request.get(`/api/posts/${postId}`)
  ).json()) as Post;
  const mediaId = current.bodyMarkdown.match(/\/api\/media\/([a-z0-9-]+)/)![1];
  await publicPage.goto(`http://127.0.0.1:3001/blog/${slug}`);
  await expect(
    publicPage.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(publicPage.locator(".prose table")).toContainText("A");
  await expect(publicPage.locator(".prose pre")).toContainText(
    "const value = 42",
  );
  await expect(publicPage.locator(".prose img").first()).toBeVisible();
  expect(
    await publicPage.evaluate(() =>
      Boolean((window as unknown as { untrusted?: boolean }).untrusted),
    ),
  ).toBe(false);
  await publicPage
    .getByRole("button", { name: "검증용 주황색 일러스트 확대 보기" })
    .click();
  await expect(publicPage.locator("dialog[open] img")).toBeVisible();
  await publicPage
    .locator("dialog[open]")
    .getByRole("button", { name: "닫기", exact: true })
    .click();
  expect((await page.request.delete(`/api/media/${mediaId}`)).status()).toBe(
    409,
  );
  await page
    .getByLabel("Markdown 본문")
    .fill(current.bodyMarkdown + "\n\n수정된 내용입니다.");
  await page
    .getByRole("button", { name: "변경 사항 저장", exact: true })
    .click();
  await expect(page.getByText("모든 변경 사항 저장됨")).toBeVisible();
  await publicPage.reload();
  await expect(publicPage.locator(".prose")).toContainText(
    "수정된 내용입니다.",
  );
  await page.goto("/admin/series/new");
  await page.getByLabel("시리즈 이름", { exact: true }).fill(seriesName);
  await page
    .getByLabel("URL 슬러그", { exact: true })
    .fill(`e2e-series-${stamp}`);
  await page
    .getByRole("button", { name: "게시글 추가", exact: true })
    .first()
    .click();
  await page
    .locator("dialog[open]")
    .getByLabel(title, { exact: false })
    .check();
  await page
    .locator("dialog[open]")
    .getByRole("button", { name: "1개 글 추가" })
    .click();
  await page.getByRole("button", { name: "시리즈 저장" }).click();
  await expect(
    page.getByRole("heading", { name: "시리즈 편집" }),
  ).toBeVisible();
  const seriesId = page.url().split("/").pop()!;
  await publicPage.goto(`http://127.0.0.1:3001/series/e2e-series-${stamp}`);
  await expect(
    publicPage.getByRole("heading", { name: seriesName, exact: true }),
  ).toBeVisible();
  await expect(
    publicPage.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `${title} 연결 해제`, exact: true })
    .click();
  await page
    .locator("dialog[open]")
    .getByRole("button", { name: "연결 해제", exact: true })
    .click();
  await page.getByRole("button", { name: "시리즈 저장" }).click();
  await expect(page.getByText("아직 연결된 글이 없어요.")).toBeVisible();
  const latestSeries = (await (
    await page.request.get("/api/series")
  ).json()) as Series[];
  expect(
    (
      await page.request.delete(`/api/series/${seriesId}`, {
        data: {
          revision: latestSeries.find((s) => s.id === seriesId)!.revision,
        },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (await publicPage.goto(`http://127.0.0.1:3001/blog/${slug}`))?.status(),
  ).toBe(200);
  const latestPost = (await (
    await page.request.get(`/api/posts/${postId}`)
  ).json()) as Post;
  expect(
    (
      await page.request.put(`/api/posts/${postId}`, {
        data: {
          ...latestPost,
          revision: latestPost.revision - 1,
          title: "오래된 수정",
        },
      })
    ).status(),
  ).toBe(409);
  await page.goto("/admin");
  await page.getByRole("searchbox", { name: "게시글 검색" }).fill(title);
  await page
    .getByRole("button", { name: `${title} 삭제`, exact: true })
    .click();
  await page
    .locator("dialog[open]")
    .getByRole("button", { name: "삭제하기", exact: true })
    .click();
  await expect(page.getByText("검색 결과가 없어요.")).toBeVisible();
  expect(
    (await publicPage.goto(`http://127.0.0.1:3001/blog/${slug}`))?.status(),
  ).toBe(404);
  expect((await page.request.delete(`/api/media/${mediaId}`)).ok()).toBe(true);
  await anonymous.close();
});
test("series ordering is persisted and deleting a collection keeps its posts", async ({
  request,
}) => {
  await request.post("/api/auth", { data: { password } });
  const stamp = Date.now();
  let s = (await (
    await request.post("/api/series", {
      data: {
        name: "API 순서 검증",
        slug: `e2e-order-${stamp}`,
        description: "",
      },
    })
  ).json()) as Series;
  const posts: Post[] = [];
  for (let i = 0; i < 3; i++)
    posts.push(
      await (
        await request.post("/api/posts", {
          data: {
            title: `순서 ${i}`,
            slug: `e2e-order-${stamp}-${i}`,
            excerpt: "",
            bodyMarkdown: "내용",
            coverUrl: "",
            coverAlt: "",
            tags: [],
            status: i === 1 ? "draft" : "published",
            visibility: "public",
            seriesId: s.id,
          },
        })
      ).json(),
    );
  s = ((await (await request.get("/api/series")).json()) as Series[]).find(
    (x) => x.id === s.id,
  )!;
  s = await (
    await request.put(`/api/series/${s.id}`, {
      data: { ...s, postIds: [posts[2].id, posts[1].id, posts[0].id] },
    })
  ).json();
  const all = (await (await request.get("/api/posts")).json()) as Post[];
  expect(
    all
      .filter((p) => p.seriesId === s.id)
      .sort((a, b) => a.seriesOrder! - b.seriesOrder!)
      .map((p) => p.id),
  ).toEqual([posts[2].id, posts[1].id, posts[0].id]);
  expect(
    (
      await request.delete(`/api/series/${s.id}`, {
        data: { revision: s.revision },
      })
    ).ok(),
  ).toBe(true);
  for (const p of posts) {
    const latest = (await (
      await request.get(`/api/posts/${p.id}`)
    ).json()) as Post;
    expect(latest.seriesId).toBe(null);
    expect(
      (
        await request.delete(`/api/posts/${p.id}`, {
          data: { revision: latest.revision },
        })
      ).ok(),
    ).toBe(true);
  }
});
