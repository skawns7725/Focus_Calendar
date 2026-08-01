import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("keeps Today Focus decision signals, schedule changes, and collapsed study plans usable on mobile", async ({ page }) => {
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
  await page.route("**/api/google/status", (route) => route.fulfill({ json: { connected: true } }));
  await page.route("**/api/google/sync", (route) => route.fulfill({ status: 403, json: { error: "sync blocked" } }));
  await page.route("**/api/push/status", (route) => route.fulfill({ json: { configured: false, notificationPromptCompleted: true } }));
  await page.route("**/api/notifications", (route) => route.fulfill({
    json: [{ id: "notification-1", kind: "carryover", questId: "unplaced", message: "미완료 항목이 오늘로 이월되었습니다." }]
  }));
  await page.route("**/api/study-plans", (route) => route.fulfill({ json: [studyPlan(plannedStart, 10)] }));

  await page.goto("/");

  const focusBlocks = page.getByTestId("today-focus");
  const changePanel = page.getByTestId("schedule-change-panel");
  const detailArea = page.getByTestId("dashboard-detail-area");
  const studyDetail = page.getByTestId("study-plan-detail");
  const statusChips = focusBlocks.locator(".focus-status-chip");
  await expect(focusBlocks).toBeVisible();
  await expect(focusBlocks.getByTestId("current-focus-card")).toBeVisible();
  await expect(statusChips).toHaveCount(3);
  await expect(page.getByText("추천 기준 시간")).toHaveCount(0);
  await expect(page.getByText("추천 작업 합계: 330분")).toBeVisible();
  await expect(page.locator(".focus-impact-alert-warning").getByText("오늘 일정 변경 1건 있음")).toBeVisible();
  await expect(page.getByText("충돌 판단: 제한됨")).toBeVisible();
  await expect(page.locator(".focus-impact-alert-danger").getByText("Google Calendar 확인 실패 때문에 일정 충돌 판단이 제한됩니다.")).toBeVisible();
  await expect(page.getByTestId("command-sync-warning")).toBeVisible();
  await expect(changePanel).toBeVisible();
  await expect(detailArea).toBeVisible();
  await expect(studyDetail).toBeVisible();
  await expect(studyDetail).not.toHaveAttribute("open", "");
  await expect(page.getByTestId("study-block-item").first()).not.toBeVisible();

  const focusBox = await focusBlocks.boundingBox();
  const statusBox = await statusChips.first().boundingBox();
  const changeSummaryBox = await page.locator(".focus-impact-alert-warning").getByText("오늘 일정 변경 1건 있음").boundingBox();
  const calendarWarningBox = await page.getByText("충돌 판단: 제한됨").boundingBox();
  const changeBox = await changePanel.boundingBox();
  const detailBox = await detailArea.boundingBox();
  expect(focusBox?.y ?? 9999).toBeLessThan(changeBox?.y ?? 0);
  expect(changeBox?.y ?? 9999).toBeLessThan(detailBox?.y ?? 0);
  expect(changeSummaryBox?.y ?? 9999).toBeLessThan(844);
  expect(calendarWarningBox?.y ?? 9999).toBeLessThan(844);
  expect(statusBox?.y ?? 9999).toBeLessThan(844);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();

  await studyDetail.locator("summary").click();
  await expect(page.getByTestId("study-block-item")).toHaveCount(3);
  await page.getByRole("button", { name: "전체 계획 보기" }).click();
  await expect(page.getByTestId("study-block-item")).toHaveCount(10);
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

function studyPlan(now: Date, count: number) {
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
    blocks: Array.from({ length: count }, (_, index) => ({
      id: `study-block-mobile-${index + 1}`,
      studyPlanId: "study-plan-mobile",
      title: `모바일 학습 블록 ${index + 1}`,
      date: today,
      stage: index % 2 === 0 ? "concept" : "practice",
      durationMinutes: 30,
      sequence: index + 1,
      status: "pending"
    }))
  };
}
