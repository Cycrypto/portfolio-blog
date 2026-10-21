import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { importPKCS8, SignJWT } from "jose";
import AxeBuilder from "@axe-core/playwright";
import type { SeriesWorkspace } from "../../src/lib/series-types";

async function adminToken() {
  const fixture = JSON.parse(readFileSync("data/e2e/access-keys.json", "utf8"));
  return new SignJWT({
    sub: "test-admin",
    email: "admin@example.com",
    type: "app",
  })
    .setProtectedHeader({ alg: "RS256", kid: "e2e" })
    .setIssuer("https://portfolio-test.cloudflareaccess.com")
    .setAudience("portfolio-admin-test")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(await importPKCS8(fixture.privateKey, "RS256"));
}

test("series endpoints require administrator identity and same-origin writes", async ({
  request,
  page,
}) => {
  await page.goto("/admin/series");
  await expect(
    page.getByRole("heading", { name: "관리자 인증을 확인해 주세요." }),
  ).toBeVisible();
  for (const assertion of ["", "forged"]) {
    const headers = {
      "cf-access-jwt-assertion": assertion,
      origin: "http://127.0.0.1:3001",
    };
    expect((await request.get("/api/admin/series", { headers })).status()).toBe(
      401,
    );
    expect(
      (await request.post("/api/admin/series", { headers, data: {} })).status(),
    ).toBe(401);
    expect(
      (await request.put("/api/admin/series", { headers, data: {} })).status(),
    ).toBe(401);
  }
  const headers = {
    "cf-access-jwt-assertion": await adminToken(),
    origin: "https://evil.example",
  };
  expect(
    (await request.post("/api/admin/series", { headers, data: {} })).status(),
  ).toBe(403);
  expect(
    (await request.put("/api/admin/series", { headers, data: {} })).status(),
  ).toBe(403);
});

test("administrator adds posts, reorders, saves, resets, and creates a series on desktop and mobile", async ({
  browser,
}) => {
  const context = await browser.newContext({
    extraHTTPHeaders: { "cf-access-jwt-assertion": await adminToken() },
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto("/admin/series");
    await expect(
      page.getByRole("heading", { name: "시리즈 관리", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("navigation", { name: "시리즈 선택" })
      .getByRole("button", { name: "홈서버 구축" })
      .click();
    const contents = page.getByRole("list", { name: "시리즈 글 순서" });
    const titles = () => contents.locator("li > div.min-w-0 > p:first-child");
    await expect(titles()).toHaveText(["서버 준비", "Docker 설치"]);
    await page
      .getByRole("button", { name: "서비스 배포 시리즈에 추가", exact: true })
      .click();
    await page.getByRole("searchbox", { name: "추가할 글 검색" }).fill("백업");
    await page
      .getByRole("button", { name: "백업 설정 시리즈에 추가", exact: true })
      .click();
    await expect(titles()).toHaveText([
      "서버 준비",
      "Docker 설치",
      "서비스 배포",
      "백업 설정",
    ]);
    await page
      .getByRole("button", { name: "서비스 배포 위로", exact: true })
      .click();
    await expect(titles()).toHaveText([
      "서버 준비",
      "서비스 배포",
      "Docker 설치",
      "백업 설정",
    ]);
    await expect(
      page.getByText("직접 정한 순서", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "저장", exact: true }),
    ).toBeDisabled();
    await page.reload();
    await page
      .getByRole("navigation", { name: "시리즈 선택" })
      .getByRole("button", { name: "홈서버 구축" })
      .click();
    await expect(titles()).toHaveText([
      "서버 준비",
      "서비스 배포",
      "Docker 설치",
      "백업 설정",
    ]);

    await page
      .getByRole("button", { name: "서비스 배포 순서 드래그", exact: true })
      .dragTo(contents.locator("li").first());
    await expect(titles()).toHaveText([
      "서비스 배포",
      "서버 준비",
      "Docker 설치",
      "백업 설정",
    ]);
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "저장", exact: true }),
    ).toBeDisabled();
    await page.screenshot({
      path: "test-results/series-desktop.png",
      fullPage: true,
    });

    await page
      .getByRole("button", { name: "발행일순으로 되돌리기", exact: true })
      .click();
    await expect(titles()).toHaveText([
      "서버 준비",
      "Docker 설치",
      "서비스 배포",
      "백업 설정",
    ]);
    await page
      .getByRole("button", { name: "백업 설정 시리즈에서 빼기", exact: true })
      .click();
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "저장", exact: true }),
    ).toBeDisabled();
    const workspace: SeriesWorkspace = await (
      await context.request.get("/api/admin/series")
    ).json();
    expect(
      workspace.series.find((series) => series.name === "홈서버 구축")?.order,
    ).toBe("publication");
    expect(
      workspace.posts.find((post) => post.title === "백업 설정")?.status,
    ).toBe("draft");

    await page
      .getByLabel("시리즈 이름", { exact: true })
      .fill("저장 안 한 이름");
    await page
      .getByRole("navigation", { name: "시리즈 선택" })
      .getByRole("button", { name: "개발 기록" })
      .click();
    await expect(
      page.getByRole("dialog", { name: "변경사항을 버릴까요?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "계속 편집", exact: true }).click();
    await expect(page.getByLabel("시리즈 이름", { exact: true })).toHaveValue(
      "저장 안 한 이름",
    );
    await page
      .getByRole("navigation", { name: "시리즈 선택" })
      .getByRole("button", { name: "개발 기록" })
      .click();
    await page
      .getByRole("button", { name: "버리고 계속", exact: true })
      .click();
    await expect(titles()).toHaveText(["서버 준비"]);
    const candidates = page.getByRole("list", { name: "추가할 글" });
    await expect(candidates.getByRole("button")).toHaveCount(2);
    await expect(candidates).not.toContainText("Docker 설치");
    await expect(candidates).not.toContainText("서비스 배포");
    await expect(candidates).toContainText("백업 설정");
    await expect(candidates).toContainText("모니터링");
    await page
      .getByRole("searchbox", { name: "추가할 글 검색" })
      .fill("Docker");
    await expect(candidates.getByRole("button")).toHaveCount(0);
    await expect(page.getByText("검색 결과가 없습니다.")).toBeVisible();
    await page.getByRole("searchbox", { name: "추가할 글 검색" }).clear();
    await page
      .getByRole("button", { name: "새 시리즈 만들기", exact: true })
      .click();
    const dialog = page.getByRole("dialog", { name: "새 시리즈", exact: true });
    await dialog.getByLabel("시리즈 이름", { exact: true }).fill("운영 노트");
    await dialog.getByRole("button", { name: "만들기", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByLabel("시리즈 이름", { exact: true })).toHaveValue(
      "운영 노트",
    );
    await expect(candidates.getByRole("button")).toHaveCount(2);
    await expect(candidates).not.toContainText("서버 준비");
    await page
      .getByRole("button", { name: "모니터링 시리즈에 추가", exact: true })
      .click();
    await page
      .getByRole("button", { name: "백업 설정 시리즈에 추가", exact: true })
      .click();
    await expect(titles()).toHaveText(["백업 설정", "모니터링"]);
    await page.getByRole("button", { name: "저장", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "저장", exact: true }),
    ).toBeDisabled();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "모니터링 위로", exact: true })
      .click();
    await expect(titles()).toHaveText(["모니터링", "백업 설정"]);
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    await page.screenshot({
      path: "test-results/series-mobile.png",
      fullPage: true,
    });
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
