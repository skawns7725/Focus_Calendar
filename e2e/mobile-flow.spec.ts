import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("keeps focus blocks and unplaced reasons within the mobile viewport", async ({ page }) => {
  const plannedStart = new Date();
  const deadline = new Date(plannedStart.getTime() + 24 * 60 * 60_000).toISOString();
  const quests = [
    task({ id: "placed", title: "모바일 집중 작업", plannedStart: plannedStart.toISOString(), deadline }),
    task({ id: "unplaced", title: "배치하지 못한 모바일 작업", plannedStart: null, deadline, expectedMinutes: 180 })
  ];

  await page.route("**/api/quests", (route) => route.fulfill({ json: quests }));
  await page.route("**/api/schedule/reconcile", (route) => route.fulfill({
    json: { carryovers: [], today: { placements: [], unplaced: [{ questId: "unplaced", reason: "insufficient_total_time" }] } }
  }));
  await page.route("**/api/google/status", (route) => route.fulfill({ json: { connected: false } }));
  await page.route("**/api/push/status", (route) => route.fulfill({ json: { configured: false, notificationPromptCompleted: true } }));
  await page.route("**/api/notifications", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/study-plans", (route) => route.fulfill({ json: [] }));

  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "모바일 메뉴" })).toBeVisible();
  const focusBlocks = page.getByRole("region", { name: "오늘의 집중 블록" });
  await expect(focusBlocks).toBeVisible();
  await expect(focusBlocks.getByRole("button", { name: "모바일 집중 작업 완료" })).toBeVisible();
  await expect(focusBlocks.getByRole("heading", { name: "배치하지 못한 할 일" })).toBeVisible();
  await expect(focusBlocks.getByText("오늘 남은 전체 시간이 180분보다 부족합니다.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "시험 공부계획" })).toBeVisible();
  expect(await focusBlocks.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBeTruthy();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

function task(input: { id: string; title: string; plannedStart: string | null; deadline: string; expectedMinutes?: number }) {
  return {
    ...input,
    note: null,
    location: null,
    recurrenceRule: null,
    kind: "flexible",
    expectedMinutes: input.expectedMinutes ?? 30,
    category: "other",
    importance: 2,
    carryoverCount: 0,
    lastCarryoverDate: null,
    status: "scheduled"
  };
}
