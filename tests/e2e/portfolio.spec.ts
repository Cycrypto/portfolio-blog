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
    "Activities",
    "Certifications",
    "Skills",
    "Languages",
    "Let’s Connect",
  ]) {
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
  }
  for (const retired of ["Recommendations"])
    await expect(
      page.getByRole("heading", { name: retired, exact: true }),
    ).toHaveCount(0);
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
test("a section with no items disappears from the page and the menu", async ({
  request,
  page,
}) => {
  const headers = { "cf-access-jwt-assertion": await token(), origin };
  const before = (await (
    await request.get("/api/admin/home", { headers })
  ).json()) as HomeDocument;
  const content = structuredClone(before.content);
  content.activities.companies = [];
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
    await expect(
      page.getByRole("heading", { name: "About", exact: true }),
    ).toBeVisible();
    await expect(page.locator("#activities")).toHaveCount(0);
    await expect(
      page
        .getByRole("navigation", { name: "주 내비게이션" })
        .getByRole("link", { name: "Activities", exact: true }),
    ).toHaveCount(0);
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
  await expect(
    page.getByRole("button", { name: "저장", exact: true }),
  ).toHaveCount(0);
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
      page.getByRole("heading", { name: "프로필 카드", level: 1 }),
    ).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page
      .locator("#home-intro-profile-avatar-file")
      .setInputFiles("public/portfolio/oliver-rowland.png");
    const avatarPreview = page.locator("#home-intro-profile-avatar-preview");
    await expect(avatarPreview).toHaveAttribute(
      "src",
      /^\/portfolio-images\/[a-f0-9]{64}\.webp$/,
    );
    const avatar = (await avatarPreview.getAttribute("src"))!;
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
    const editorNav = page.getByRole("navigation", { name: "편집 영역" });
    await expect(
      editorNav.getByRole("button", { name: /^프로필 카드/ }).getByRole("img", {
        name: "저장되지 않은 변경",
      }),
    ).toBeVisible();
    await editorNav.getByRole("button", { name: /^첫 화면/ }).click();
    await page.locator("#home-intro-title").fill("편집한 포트폴리오");
    await page.locator("#home-intro-title").fill("");
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(page.locator("#home-intro-title")).toBeFocused();
    await expect(
      page.getByRole("alert").filter({ hasText: "입력 오류 1개가 있어" }),
    ).toBeVisible();
    await expect(
      editorNav.getByRole("button", { name: /^첫 화면/ }).getByRole("img", {
        name: "오류 1개",
      }),
    ).toBeVisible();
    await page.locator("#home-intro-title").fill("편집한 포트폴리오");
    await expect(
      page.getByRole("alert").filter({ hasText: "입력 오류 1개가 있어" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "미리보기", exact: true }).click();
    const frame = page.frameLocator('iframe[title="메인 화면 미리보기"]');
    await expect(
      frame.getByRole("heading", { name: "편집한 포트폴리오", exact: true }),
    ).toBeVisible();
    await expect(frame.locator(`img[src="${avatar}"]`)).toBeVisible();
    await page.getByRole("button", { name: "닫기", exact: true }).click();
    await page.keyboard.press("ControlOrMeta+s");
    await expect(
      page.getByRole("status").filter({ hasText: "모두 저장됨" }),
    ).toBeVisible();
    await page.reload();
    await page
      .getByRole("navigation", { name: "편집 영역" })
      .getByRole("button", { name: /^첫 화면/ })
      .click();
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
