import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("keeps focus blocks and study plans within the mobile viewport", async ({ page }) => {
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
  await page.route("**/api/study-plans", (route) => route.fulfill({ json: [studyPlan(plannedStart)] }));

  await page.goto("/");

  const focusBlocks = page.getByTestId("today-focus");
  await expect(focusBlocks).toBeVisible();
  await expect(focusBlocks.getByTestId("today-focus-item")).toHaveCount(2);
  await expect(page.getByTestId("study-plan-scheduler")).toBeVisible();
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

function studyPlan(now: Date) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  return {
    id: "study-plan-mobile",
    examName: "기말고사",
    subject: "수학",
    examDate: "2026-07-01",
    scope: "1단원",
    progress: 10,
    difficulty: 2,
    dailyMinutes: 60,
    dDay: 7,
    risk: { level: "medium", score: 70, reason: "꾸준히 진행해야 합니다." },
    blocks: [{
      id: "study-block-mobile",
      studyPlanId: "study-plan-mobile",
      title: "모바일 학습 블록",
      date: today,
      stage: "concept",
      durationMinutes: 30,
      sequence: 1,
      status: "pending"
    }]
  };
}
