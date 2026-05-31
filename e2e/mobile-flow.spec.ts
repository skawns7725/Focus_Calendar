import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("shows mobile navigation and slide completion", async ({ page, request }) => {
  const title = `모바일 테스트 할 일 ${Date.now()}`;
  const response = await request.post("/api/quests", {
    data: {
      title,
      kind: "flexible",
      deadline: "2026-06-02T18:00:00+09:00",
      expectedMinutes: 30,
      importance: 2
    }
  });
  expect(response.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "모바일 메뉴" })).toBeVisible();
  const quest = page.getByRole("article").filter({ hasText: title });
  await expect(quest.getByRole("button", { name: "밀어서 완료", exact: true })).toBeVisible();
});
