import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("system appearance updates posts, series and search without reloading", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/series-smoke-3/");
  const background = () =>
    page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
  const light = await background();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  expect(await background()).not.toBe(light);
  await expect(page.locator("[data-series]")).toBeVisible();
  await page.screenshot({ path: "test-results/blog-dark-article.png" });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.getByRole("button", { name: "검색", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "글 검색" })).toBeVisible();
  await expect(page.locator(".search-field input")).toHaveCSS(
    "color",
    "rgb(244, 233, 223)",
  );
  await page.screenshot({ path: "test-results/blog-dark-search.png" });
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  expect(await background()).toBe(light);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/blog-dark-mobile.png" });
});
