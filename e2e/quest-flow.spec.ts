import { expect, test } from "@playwright/test";

test("creates and completes a quest from the priority list", async ({ page }) => {
  const title = `보고서 작성 ${Date.now()}`;
  const quests: ReturnType<typeof task>[] = [];

  await page.route("**/api/quests", async (route) => {
    if (route.request().method() === "POST") {
      const input = await route.request().postDataJSON();
      const created = task({ id: "created-quest", title: input.title, deadline: input.deadline, expectedMinutes: input.expectedMinutes });
      quests.push(created);
      await route.fulfill({ json: created });
      return;
    }
    await route.fulfill({ json: quests });
  });
  await page.route("**/api/quests/*/complete", async (route) => {
    quests[0] = { ...quests[0], status: "completed" };
    await route.fulfill({ json: quests[0] });
  });
  await page.route("**/api/schedule/reconcile", (route) => route.fulfill({
    json: { carryovers: [], today: { placements: [], unplaced: [] } }
  }));
  await page.route("**/api/google/status", (route) => route.fulfill({ json: { connected: false } }));
  await page.route("**/api/push/status", (route) => route.fulfill({ json: { configured: false, notificationPromptCompleted: true } }));
  await page.route("**/api/notifications", (route) => route.fulfill({ json: [] }));
  await page.route("**/api/study-plans", (route) => route.fulfill({ json: [] }));

  await page.goto("/");
  await page.getByTestId("add-task-button").click();
  await page.locator('[name="title"]').fill(title);
  await page.locator('[name="deadline"]').fill("2026-06-02T18:00");
  await page.locator('[name="expectedMinutes"]').fill("60");
  await page.locator(".quest-form").locator('[type="submit"]').click();

  const quest = page.getByTestId("quest-card").filter({ hasText: title });
  await expect(quest).toBeVisible();
  await quest.getByTestId("quest-complete-button").click();
  await expect(page.getByText(/오늘 완료 1개/)).toBeVisible();
});

function task(input: { id: string; title: string; deadline: string; expectedMinutes: number }) {
  return {
    id: input.id,
    title: input.title,
    note: null,
    location: null,
    recurrenceRule: null,
    kind: "flexible",
    deadline: input.deadline,
    expectedMinutes: input.expectedMinutes,
    category: "other",
    importance: 2,
    carryoverCount: 0,
    lastCarryoverDate: null,
    plannedStart: null,
    status: "scheduled"
  };
}
