import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { importPKCS8, SignJWT } from "jose";
import AxeBuilder from "@axe-core/playwright";
import type { HomeDocument } from "../../src/lib/types";
const origin = "http://127.0.0.1:3001";
async function token(audience = "portfolio-admin-test") {
  const fixture = JSON.parse(readFileSync("data/e2e/access-keys.json", "utf8"));
  const key = await importPKCS8(fixture.privateKey, "RS256");
  return new SignJWT({
    sub: "test-admin",
    email: "admin@example.com",
    type: "app",
  })
    .setProtectedHeader({ alg: "RS256", kid: "e2e" })
    .setIssuer("https://portfolio-test.cloudflareaccess.com")
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(key);
}
test("Pencil portfolio renders all sections and original artwork on desktop and mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Full Stack Developer",
      exact: true,
      level: 1,
    }),
  ).toBeVisible();
  for (const title of [
    "About",
    "Experience",
    "Education",
    "Certifications",
    "Skills",
    "Languages",
    "Recommendations",
    "Let’s Connect",
  ]) {
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  expect(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.every(
          (i) =>
            (i as HTMLImageElement).complete &&
            (i as HTMLImageElement).naturalWidth > 0,
        ),
      ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/portfolio-desktop.png",
    fullPage: true,
  });
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page
    .getByRole("navigation", { name: "모바일 내비게이션" })
    .getByRole("link", { name: "Experience", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "메뉴 열기" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/portfolio-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("retired public pages, admin pages, and APIs are really removed", async ({
  request,
}) => {
  for (const path of [
    "/blog",
    "/blog/old",
    "/series",
    "/resume",
    "/admin/login",
    "/admin/home",
    "/admin/posts/new",
    "/admin/media",
    "/admin/series",
    "/api/posts",
    "/api/series",
    "/api/media",
    "/api/auth",
    "/api/home",
  ]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});
test("projects without logos keep readable text widths on desktop and mobile", async ({
  request,
  page,
}) => {
  const headers = { "cf-access-jwt-assertion": await token(), origin };
  const before = (await (
    await request.get("/api/admin/home", { headers })
  ).json()) as HomeDocument;
  const content = structuredClone(before.content);
  content.experience.companies[0].logo = "";
  content.experience.companies[0].roles[0].title =
    "백엔드·인프라: 서비스가 동작하는 구조를 다룹니다";
  try {
    expect(
      (
        await request.put("/api/admin/home", {
          headers,
          data: { content, revision: before.revision },
        })
      ).status(),
    ).toBe(200);
    await page.goto("/");
    for (const width of [1081, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const section = await page.locator("#experience").boundingBox();
      const article = await page
        .locator("#experience article")
        .first()
        .boundingBox();
      expect(article!.width).toBeGreaterThan(section!.width * 0.8);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  } finally {
    const latest = (await (
      await request.get("/api/admin/home", { headers })
    ).json()) as HomeDocument;
    await request.put("/api/admin/home", {
      headers,
      data: { content: before.content, revision: latest.revision },
    });
  }
});
test("anonymous, forged, and wrong-application tokens cannot read or write administrator content", async ({
  request,
  page,
}) => {
  await page.goto("/admin");
  await expect(page.getByText("관리자 인증을 확인해 주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "변경사항 저장" })).toHaveCount(
    0,
  );
  for (const assertion of ["", "forged", await token("public-application")]) {
    const headers = {
      "cf-access-jwt-assertion": assertion,
      "cf-access-authenticated-user-email": "admin@example.com",
      origin,
    };
    expect((await request.get("/api/admin/home", { headers })).status()).toBe(
      401,
    );
    expect(
      (await request.post("/api/admin/images", { headers, data: {} })).status(),
    ).toBe(401);
    expect(
      (await request.put("/api/admin/home", { headers, data: {} })).status(),
    ).toBe(401);
  }
});
test("authorized administrator edits SQLite content and public page reflects it after reload", async ({
  browser,
}) => {
  const assertion = await token();
  const context = await browser.newContext({
    extraHTTPHeaders: { "cf-access-jwt-assertion": assertion },
  });
  const page = await context.newPage();
  const before = (await (
    await context.request.get(`${origin}/api/admin/home`)
  ).json()) as HomeDocument;
  try {
    await page.goto(`${origin}/admin`);
    await expect(
      page.getByRole("heading", { name: "홈 화면 편집" }),
    ).toBeVisible();
    await page
      .locator("#home-intro-profile-avatar-file")
      .setInputFiles("public/portfolio/oliver-rowland.png");
    const avatarField = page.locator("#home-intro-profile-avatar");
    await expect(avatarField).toHaveValue(
      /^\/portfolio-images\/[a-f0-9]{64}\.webp$/,
    );
    const avatar = await avatarField.inputValue();
    expect(
      (await context.request.get(`${origin}${avatar}`)).headers()[
        "content-type"
      ],
    ).toBe("image/webp");
    expect(
      (
        await context.request.post(`${origin}/api/admin/images`, {
          headers: { origin: "https://evil.example" },
          data: {},
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await context.request.post(`${origin}/api/admin/images`, {
          headers: { origin },
          multipart: {
            file: {
              name: "fake.png",
              mimeType: "image/png",
              buffer: Buffer.from("<svg/>"),
            },
          },
        })
      ).status(),
    ).toBe(400);
    await page.locator("#home-intro-title").fill("편집한 포트폴리오");
    await page.getByRole("button", { name: "미리보기", exact: true }).click();
    await expect(
      page
        .getByRole("region", { name: "메인 화면 미리보기" })
        .getByRole("heading", { name: "편집한 포트폴리오", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "변경사항 저장", exact: true })
      .first()
      .click();
    await expect(
      page.getByRole("status").filter({ hasText: "저장 완료" }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator("#home-intro-title")).toHaveValue(
      "편집한 포트폴리오",
    );
    const publicPage = await browser.newPage();
    await publicPage.goto(origin);
    await expect(publicPage.locator(`img[src="${avatar}"]`)).toBeVisible();
    await expect(
      publicPage.getByRole("heading", {
        name: "편집한 포트폴리오",
        exact: true,
      }),
    ).toBeVisible();
    await publicPage.close();
    expect(
      (
        await context.request.put(`${origin}/api/admin/home`, {
          headers: { origin },
          data: before,
        })
      ).status(),
    ).toBe(409);
    const current = (await (
      await context.request.get(`${origin}/api/admin/home`)
    ).json()) as HomeDocument;
    expect(
      (
        await context.request.put(`${origin}/api/admin/home`, {
          headers: { origin: "https://evil.example" },
          data: current,
        })
      ).status(),
    ).toBe(403);
    await page.locator("#home-intro-title").fill("保存前");
    await page.getByRole("link", { name: "사이트 보기" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "계속 편집", exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: "test-results/admin-mobile.png",
      fullPage: true,
    });
  } finally {
    const latest = (await (
      await context.request.get(`${origin}/api/admin/home`)
    ).json()) as HomeDocument;
    await context.request.put(`${origin}/api/admin/home`, {
      headers: { origin },
      data: { content: before.content, revision: latest.revision },
    });
    await context.close();
  }
});
