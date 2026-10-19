import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Post } from "../../src/lib/types";

test.beforeEach(async ({ page }) => {
  expect(
    (
      await page.request.post("/api/auth", {
        data: { password: "test-portfolio-password" },
      })
    ).ok(),
  ).toBe(true);
});

test("admin pages remain accessible and usable on a narrow phone and desktop", async ({
  page,
}) => {
  test.setTimeout(180000);
  const failures: unknown[] = [];
  for (const width of [320, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/admin",
      "/admin/posts/new",
      "/admin/series",
      "/admin/series/new",
      "/admin/media",
    ]) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${path} at ${width}px`,
      ).toBe(true);
      const { violations } = await new AxeBuilder({ page })
        .exclude("nextjs-portal")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      if (violations.length)
        failures.push({
          path,
          width,
          violations: violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        });
    }
  }
  expect(failures).toEqual([]);
});

test("failed saves keep content, explain the problem and can be retried", async ({
  page,
}) => {
  await page.goto("/admin/posts/new");
  const title = `오류 복구 검증 ${Date.now()}`;
  await page.getByLabel("게시글 제목", { exact: true }).fill(title);
  await page
    .getByLabel("Markdown 본문")
    .fill("## 연결이 끊겨도\n\n작성 중인 내용은 남아 있어야 합니다.");
  await page.route("**/api/posts", (route) =>
    route.abort("internetdisconnected"),
  );
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(page.getByRole("alert").first()).toContainText(
    "서버에 연결할 수 없어요",
  );
  await expect(page.getByLabel("게시글 제목", { exact: true })).toHaveValue(
    title,
  );
  await expect(page.getByLabel("Markdown 본문")).toHaveValue(/작성 중인 내용/);
  await page.unroute("**/api/posts");
  await page.route("**/api/posts", (route) =>
    route.fulfill({
      status: 503,
      contentType: "text/html",
      body: "<h1>Service unavailable</h1>",
    }),
  );
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(page.getByRole("alert").first()).toContainText(
    "요청을 처리하지 못했어요",
  );
  await page.unroute("**/api/posts");
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(page.getByText("모든 변경 사항 저장됨")).toBeVisible();
  const id = page.url().split("/").pop()!;
  const post = (await (
    await page.request.get(`/api/posts/${id}`)
  ).json()) as Post;
  expect(post.title).toBe(title);
  expect(
    (
      await page.request.delete(`/api/posts/${id}`, {
        data: { revision: post.revision },
      })
    ).ok(),
  ).toBe(true);
});

test("image picker reports library failures and rejects invalid files without uploading a stale selection", async ({
  page,
}) => {
  await page.goto("/admin/posts/new");
  await page.route("**/api/media", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "이미지 목록을 불러오지 못했어요." }),
    }),
  );
  await page.getByRole("button", { name: "이미지 삽입", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "글에 이미지 추가" });
  await dialog
    .getByRole("button", { name: "이미지 보관함", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "이미지 목록을 불러오지 못했어요.",
  );
  await page.unroute("**/api/media");
  await dialog.getByRole("button", { name: "다시 불러오기" }).click();
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await dialog.getByRole("button", { name: "새 이미지", exact: true }).click();
  await dialog
    .locator("input[type=file]")
    .setInputFiles("tests/fixtures/orange-illustration.png");
  await dialog.getByLabel("대체 텍스트 · 필수").fill("테스트 이미지");
  await expect(
    dialog.getByRole("button", { name: "이미지 업로드", exact: true }),
  ).toBeEnabled();
  await dialog.locator("input[type=file]").setInputFiles({
    name: "invalid.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(dialog.getByRole("alert")).toContainText("JPG, PNG, WebP");
  await expect(
    dialog.getByRole("button", { name: "이미지 업로드", exact: true }),
  ).toBeDisabled();
});

test("unsaved writing can be recovered after reload and disappears after a successful save", async ({
  page,
}) => {
  await page.goto("/admin/posts/new");
  const title = `복구 가능한 기록 ${Date.now()}`;
  const body =
    "## 아직 저장하지 않은 생각\n\n새로고침 후에도 되찾을 수 있어야 합니다.";
  await page.getByLabel("게시글 제목", { exact: true }).fill(title);
  await page.getByLabel("Markdown 본문").fill(body);
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("portfolio:post:new")),
    )
    .toContain(title);
  page.once("dialog", (dialog) => dialog.accept());
  await page.reload();
  await page
    .getByRole("button", { name: "작성 내용 복구", exact: true })
    .click();
  await expect(page.getByLabel("게시글 제목", { exact: true })).toHaveValue(
    title,
  );
  await expect(page.getByLabel("Markdown 본문")).toHaveValue(body);
  await page.getByRole("button", { name: "임시 저장", exact: true }).click();
  await expect(page.getByText("모든 변경 사항 저장됨")).toBeVisible();
  const id = page.url().split("/").pop()!;
  await page.reload();
  await expect(
    page.getByRole("button", { name: "작성 내용 복구" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Markdown 본문")).toHaveValue(body);
  const saved = (await (
    await page.request.get(`/api/posts/${id}`)
  ).json()) as Post;
  expect(
    (
      await page.request.delete(`/api/posts/${id}`, {
        data: { revision: saved.revision },
      })
    ).ok(),
  ).toBe(true);
});

test("series sidebar navigation protects unsaved work and discard does not leave a recovery copy", async ({
  page,
}) => {
  await page.goto("/admin/series/new");
  await page
    .getByLabel("시리즈 이름", { exact: true })
    .fill("보호해야 할 시리즈");
  await page
    .getByRole("navigation", { name: "관리 메뉴" })
    .getByRole("link", { name: "게시글", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "저장하지 않은 변경이 있어요.",
  });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/series\/new$/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByLabel("시리즈 이름", { exact: true })).toHaveValue(
    "보호해야 할 시리즈",
  );
  await page
    .getByRole("navigation", { name: "관리 메뉴" })
    .getByRole("link", { name: "이미지", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "저장하지 않고 나가기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/media$/);
  await page.goto("/admin/series/new");
  await expect(
    page.getByRole("button", { name: "시리즈 변경 복구" }),
  ).toHaveCount(0);
});

test("publishing stays open during a slow save and explains a server rejection inside the dialog", async ({
  page,
}) => {
  await page.goto("/admin/posts/new");
  await page.getByLabel("게시글 제목", { exact: true }).fill("느린 저장 검증");
  await page
    .getByLabel("Markdown 본문")
    .fill("저장 중에는 닫혀서 진행 상황을 잃지 않아야 합니다.");
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/posts", async (route) => {
    await gate;
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "이미 사용 중인 URL 슬러그입니다." }),
    });
  });
  await page.getByRole("button", { name: "발행하기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "게시글을 발행할까요?" });
  await dialog.getByRole("button", { name: "발행하기", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "닫기", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  release();
  await expect(dialog.getByRole("alert")).toContainText("이미 사용 중인 URL");
  await expect(
    dialog.getByRole("button", { name: "닫기", exact: true }),
  ).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("게시글 제목", { exact: true })).toHaveValue(
    "느린 저장 검증",
  );
});
