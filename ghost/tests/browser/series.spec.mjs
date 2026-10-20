import { expect, test } from "@playwright/test";
import { expectedSeriesSlugs, seriesSlug } from "../fixtures/series.mjs";

const path = (slug) => `/${slug}/`;

test("the full series archive follows manual order across the normal page size", async ({
  page,
}) => {
  await page.goto(`/tag/${seriesSlug}/`);
  const feed = page.locator("[data-series-feed]");
  await expect(feed.locator("article")).toHaveCount(12);
  await expect(feed.locator(".post-card__link").first()).toHaveAttribute(
    "href",
    path(expectedSeriesSlugs[0]),
  );
  expect(
    await feed
      .locator(".post-card__link")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
  ).toEqual(expectedSeriesSlugs.map(path));
  await expect(feed.locator("[data-series-number]")).toHaveText(
    expectedSeriesSlugs.map((_, index) => `${index + 1}.`),
  );
  await expect(page.locator(".pagination")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("초안");
});

for (const index of [0, 2, 11]) {
  test(`series contents and adjacent posts at position ${index + 1}`, async ({
    page,
  }) => {
    await page.goto(path(expectedSeriesSlugs[index]));
    const panel = page.locator("[data-series]");
    await expect(panel.locator(".series__link")).toHaveCount(12);
    await expect(panel.locator('[aria-current="page"]')).toHaveAttribute(
      "href",
      path(expectedSeriesSlugs[index]),
    );
    await expect(panel.locator("[data-series-progress]")).toHaveText(
      `${index + 1} / 12`,
    );
    expect(
      await panel
        .locator(".series__link")
        .evaluateAll((links) => links.map((link) => link.getAttribute("href"))),
    ).toEqual(expectedSeriesSlugs.map(path));
    const navigation = page.locator("[data-series-navigation]");
    const previous = navigation.locator('[rel="prev"]');
    const next = navigation.locator('[rel="next"]');
    if (index > 0)
      await expect(previous).toHaveAttribute(
        "href",
        path(expectedSeriesSlugs[index - 1]),
      );
    else await expect(previous).toHaveCount(0);
    if (index < 11)
      await expect(next).toHaveAttribute(
        "href",
        path(expectedSeriesSlugs[index + 1]),
      );
    else await expect(next).toHaveCount(0);
    await expect(page.locator("[data-general-next]")).toBeHidden();
    await expect(page.locator(".article-tags")).not.toContainText(
      "#series-order",
    );
    await expect(panel).not.toContainText("초안");
  });
}

test("the links actually open the adjacent part and update the current marker", async ({
  page,
}) => {
  await page.goto(path(expectedSeriesSlugs[1]));
  await page.locator('[data-series-navigation] [rel="next"]').click();
  await expect(page).toHaveURL(new RegExp(`${path(expectedSeriesSlugs[2])}$`));
  await expect(
    page.locator('[data-series] [aria-current="page"]'),
  ).toHaveAttribute("href", path(expectedSeriesSlugs[2]));
  await page.locator('[data-series-navigation] [rel="prev"]').click();
  await expect(page).toHaveURL(new RegExp(`${path(expectedSeriesSlugs[1])}$`));
});

test("one-part series never sends readers to unrelated posts", async ({
  page,
}) => {
  await page.goto("/series-smoke-single/");
  await expect(page.locator("[data-series-progress]")).toHaveText("1 / 1");
  await expect(page.locator("[data-series-navigation]")).toBeHidden();
  await expect(page.locator("[data-general-next]")).toBeHidden();
});

test("ordinary posts and tag pages keep their current layout", async ({
  page,
}) => {
  await page.goto("/cv-and-blog-on-one-server/");
  await expect(page.locator("[data-series]")).toHaveCount(0);
  await expect(page.locator("[data-general-next] .next-post")).toBeVisible();
  await page.goto("/tag/infra/");
  await expect(page.locator("[data-series-feed]")).toHaveCount(0);
  await expect(page.locator(".post-card")).toHaveCount(2);
});

test("mobile contents collapse, support keyboard input, and fit the reading width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(path(expectedSeriesSlugs[2]));
  const panel = page.locator("[data-series]");
  await expect(panel).not.toHaveAttribute("open", "");
  await panel.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(panel).toHaveAttribute("open", "");
  await expect(panel.locator('[aria-current="page"]')).toBeVisible();
  await expect(
    page.locator('[data-series-navigation] [rel="next"]'),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("contents remain ordinary accessible links without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  const page = await context.newPage();
  await page.goto(path(expectedSeriesSlugs[2]));
  await expect(page.locator("[data-series-list] a")).toHaveCount(12);
  await expect(page.locator(".series__all")).toHaveAttribute(
    "href",
    `/tag/${seriesSlug}/`,
  );
  await context.close();
});

test("series beyond Ghost's 100-post query cap include every part", async ({
  page,
}) => {
  await page.goto("/series-long-101/");
  await expect(page.locator("[data-series-list] a")).toHaveCount(101);
  await expect(page.locator("[data-series-progress]")).toHaveText("1 / 101");
  await expect(
    page.locator('[data-series-navigation] [rel="next"]'),
  ).toHaveAttribute("href", "/series-long-100/");
  await page.goto("/tag/series-long/");
  const cards = page.locator("[data-series-feed] article");
  await expect(cards).toHaveCount(101);
  await expect(cards.first().locator(".post-card__link")).toHaveAttribute(
    "href",
    "/series-long-101/",
  );
  await expect(cards.last().locator(".post-card__link")).toHaveAttribute(
    "href",
    "/series-long-1/",
  );
  await expect(cards.last().locator("[data-series-number]")).toHaveText("101.");
});
