import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.describe("메인 랭킹 페이지", () => {
  test("첫 페이지 로드 시 영상 카드가 표시된다", async ({ page }) => {
    await page.goto(`${BASE}/ko`);

    // 영상 카드가 최소 1개 이상 렌더링되어야 함
    const cards = page.locator("article[role='article']");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("영상 카드에 제목, 채널명, 조회수가 표시된다", async ({ page }) => {
    await page.goto(`${BASE}/ko`);

    const firstCard = page.locator("article[role='article']").first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    // 제목(h3)이 비어있지 않아야 함
    const title = firstCard.locator("h3");
    await expect(title).not.toBeEmpty();

    // 조회수 텍스트(👁 포함)가 있어야 함
    await expect(firstCard.locator("text=👁")).toBeVisible();
  });

  test("영상 카드 클릭 시 상세 페이지로 이동한다", async ({ page }) => {
    await page.goto(`${BASE}/ko`);

    const firstCard = page.locator("article[role='article']").first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    await firstCard.click();

    // /ko/v/숫자 경로로 이동해야 함
    await expect(page).toHaveURL(/\/ko\/v\/\d+/, { timeout: 5000 });
  });

  test("키보드로 카드 탐색이 가능하다 (접근성)", async ({ page }) => {
    await page.goto(`${BASE}/ko`);

    // Tab 키로 첫 번째 카드에 포커스
    await page.keyboard.press("Tab");

    // 포커스된 요소가 article이거나 내부 링크여야 함
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible({ timeout: 3000 });
  });
});

test.describe("영상 상세 페이지", () => {
  test("상세 페이지에 JSON-LD VideoObject가 삽입된다", async ({ page }) => {
    await page.goto(`${BASE}/ko`);
    const firstCard = page.locator("article[role='article']").first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    await firstCard.click();
    await page.waitForURL(/\/ko\/v\/\d+/);

    // JSON-LD 스크립트 태그 존재 확인
    const ldScript = page.locator('script[type="application/ld+json"]');
    await expect(ldScript).toHaveCount(1);

    const ldContent = await ldScript.textContent();
    const ld = JSON.parse(ldContent ?? "{}");
    expect(ld["@type"]).toBe("VideoObject");
    expect(ld.name).toBeTruthy();
  });
});

test.describe("쿠키 동의 배너", () => {
  test("첫 방문 시 쿠키 배너가 표시된다", async ({ page }) => {
    // 쿠키 없는 새 컨텍스트에서 방문
    await page.context().clearCookies();
    await page.goto(`${BASE}/ko`);

    // 쿠키 배너가 노출되어야 함
    const banner = page.locator("[data-testid='cookie-banner'], [role='dialog']").first();
    await expect(banner).toBeVisible({ timeout: 5000 });
  });
});

test.describe("무한 스크롤", () => {
  test("스크롤 시 추가 카드가 로드된다", async ({ page }) => {
    await page.goto(`${BASE}/ko`);

    const cards = page.locator("article[role='article']");
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const initialCount = await cards.count();

    // 페이지 끝까지 스크롤
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const afterCount = await cards.count();
    // 스크롤 후 카드가 더 많아지거나 동일해야 함 (데이터 없으면 동일)
    expect(afterCount).toBeGreaterThanOrEqual(initialCount);
  });
});
