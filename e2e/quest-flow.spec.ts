import { expect, test } from "@playwright/test";

test("creates and completes a quest from the priority list", async ({ page }) => {
  const title = `보고서 작성 ${Date.now()}`;
  await page.goto("/");
  await page.getByRole("button", { name: "+ 할 일 추가", exact: true }).click();
  await page.getByPlaceholder("예: 보고서 초안 작성").fill(title);
  await page.getByLabel("마감 시각").fill("2026-06-02T18:00");
  await page.getByLabel("예상 소요 시간").fill("60");
  await page.getByRole("button", { name: "할 일 추가", exact: true }).click();

  const quest = page.getByRole("article").filter({ hasText: title });
  await expect(quest).toBeVisible();
  await quest.getByRole("button", { name: "완료", exact: true }).click();
  await expect(page.getByText("오늘 완료 1개", { exact: true })).toBeVisible();
});
