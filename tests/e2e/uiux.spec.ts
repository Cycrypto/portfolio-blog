import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectNoOverflow(page: Page) {
  expect(
    await page.evaluate(() => ({
      viewport: window.innerWidth,
      content: document.documentElement.scrollWidth,
    })),
  ).toEqual(expect.objectContaining({ content: expect.any(Number) }));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
    ),
  ).toBe(true);
}

test("journal preserves search, topic and pagination across reload and browser history", async ({
  page,
}) => {
  await page.goto("/blog");
  await page.getByRole("button", { name: "일상", exact: true }).click();
  await expect(page).toHaveURL(/tag=/);
  await expect(
    page.getByRole("button", { name: "일상", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.locator("main article")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "게시글 검색" }).fill("  기록  ");
  await expect(page.locator("main article")).toHaveCount(1);
  await page.reload();
  await expect(
    page.getByRole("searchbox", { name: "게시글 검색" }),
  ).toHaveValue("  기록  ");
  await page.getByRole("button", { name: "개발", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "개발", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "일상", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/blog?page=2");
  await expect(
    page.getByRole("button", { name: "2페이지", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.locator("main article a").first().click();
  await expect(page).toHaveURL(/\/blog\/[^/?]+$/);
  await expect(page.locator(".prose")).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "2페이지", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "이전 페이지", exact: true }).click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.locator("main [tabindex='-1']")).toBeFocused();
});

test("mobile navigation closes with Escape and does not reopen after a desktop resize", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/blog");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await expect(
    page.getByRole("navigation", { name: "모바일 내비게이션" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "모바일 내비게이션" })
      .getByRole("link", { name: "블로그", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "모바일 내비게이션" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "메뉴 열기" })).toBeFocused();
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("public pages pass automated accessibility checks at desktop and narrow mobile widths", async ({
  page,
}) => {
  test.setTimeout(180000);
  const failures: unknown[] = [];
  for (const width of [1440, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/blog",
      "/series",
      "/series/building-a-blog",
      "/blog/design-system-notes",
      "/missing-page",
      "/admin/login",
    ]) {
      await page.goto(path);
      await expectNoOverflow(page);
      const { violations } = await new AxeBuilder({ page })
        .exclude("nextjs-portal")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      if (violations.length)
        failures.push({
          width,
          path,
          violations: violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
        });
    }
  }
  expect(failures).toEqual([]);
});

test("modal traps focus, closes on Escape and restores the invoking control", async ({
  page,
}) => {
  await page.goto("/blog/design-system-notes");
  const trigger = page.getByRole("button", { name: /확대 보기/ }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "이미지 확대 보기" });
  await expect(dialog).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Shift+Tab");
  expect(
    await dialog.evaluate((el) => el.contains(document.activeElement)),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});
