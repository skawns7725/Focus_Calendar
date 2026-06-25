import { APIRequestContext, expect, Page, test } from "@playwright/test";

const previewUrl = process.env.PREVIEW_CORE_SMOKE_URL;
const previewSecret = process.env.PREVIEW_TEST_LOGIN_SECRET;
const protectionBypass = process.env.VERCEL_PROTECTION_BYPASS_SECRET;

test.use({ viewport: { width: 390, height: 844 } });

test.skip(!previewUrl || !previewSecret, "Preview core smoke requires PREVIEW_CORE_SMOKE_URL and PREVIEW_TEST_LOGIN_SECRET.");

test("runs core product smoke without Google OAuth", async ({ page, request }) => {
  if (protectionBypass) {
    await page.setExtraHTTPHeaders(protectionHeaders());
  }
  const primaryCookie = await previewLogin(request);
  await installSessionCookie(page, primaryCookie);

  const runId = Date.now();
  const plannedStart = new Date(Date.now() + 60 * 60_000).toISOString();
  const deadline = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  const studyQuestTitle = `Preview smoke study ${runId}`;
  const workQuestTitle = `Preview smoke work ${runId}`;

  await api(request, primaryCookie, "POST", "/api/quests", {
    title: studyQuestTitle,
    note: "preview core smoke",
    location: null,
    recurrenceRule: null,
    kind: "fixed",
    plannedStart,
    deadline,
    expectedMinutes: 20,
    category: "study",
    importance: 3
  });
  await api(request, primaryCookie, "POST", "/api/quests", {
    title: workQuestTitle,
    note: "preview core smoke",
    location: null,
    recurrenceRule: null,
    kind: "fixed",
    plannedStart,
    deadline,
    expectedMinutes: 30,
    category: "work",
    importance: 3
  });

  const otherCookie = await previewLogin(request);
  const otherQuestTitle = `Preview smoke other owner ${runId}`;
  await api(request, otherCookie, "POST", "/api/quests", {
    title: otherQuestTitle,
    note: "owner isolation smoke",
    location: null,
    recurrenceRule: null,
    kind: "fixed",
    plannedStart,
    deadline,
    expectedMinutes: 15,
    category: "personal",
    importance: 3
  });

  const studyPlan = await api(request, primaryCookie, "POST", "/api/study-plans", {
    examName: `Preview smoke exam ${runId}`,
    subject: "Math",
    examDate: addDays(koreaToday(), 3),
    scope: "Algebra and error review",
    progress: 10,
    difficulty: 2,
    dailyMinutes: 60
  });
  const studyBlock = studyPlan.blocks.find((block: { date: string }) => block.date === koreaToday()) ?? studyPlan.blocks[0];

  await page.goto("/");
  await expect(page.getByTestId("today-focus")).toBeVisible();

  const focusItems = page.getByTestId("today-focus-item");
  await expect(focusItems.filter({ hasText: studyQuestTitle }).first()).toBeVisible();
  await expect(focusItems.filter({ hasText: workQuestTitle }).first()).toBeVisible();
  await expect(page.getByText(otherQuestTitle)).toHaveCount(0);
  await expect(focusItems.first()).toContainText(studyQuestTitle);
  const studyQuestItem = focusItems.filter({ hasText: studyQuestTitle }).first();
  await expect(studyQuestItem.locator("span").nth(0)).toContainText("20");
  await expect(studyQuestItem.locator("span").nth(1)).not.toHaveText("");
  await expect(studyQuestItem.locator("span").nth(2)).not.toHaveText("");
  await expect(page.getByTestId("today-focus")).toContainText("50");

  await expect(page.getByText(studyPlan.examName)).toBeVisible();
  await expect(page.getByText(studyBlock.title)).toBeVisible();
  const studyBlockFocusItem = focusItems.filter({ hasText: studyBlock.title }).first();
  await expect(studyBlockFocusItem).toBeVisible();
  await studyBlockFocusItem.locator("button").click();
  await expect(page.getByTestId("today-focus-item").filter({ hasText: studyBlock.title })).toHaveCount(0);

  const cronResponse = await fetch(`${previewUrl}/api/schedule/reconcile`, { headers: protectionHeaders() });
  expect(cronResponse.status).toBe(401);

  await page.goto("/settings");
  await expect(page.locator('a[href*="mode=write"]')).toHaveCount(0);

  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

async function previewLogin(request: APIRequestContext) {
  const response = await request.post(`${previewUrl}/api/test/login`, {
    headers: { authorization: `Bearer ${previewSecret}`, ...protectionHeaders() }
  });
  expect(response.status()).toBe(200);
  const session = (await request.storageState()).cookies.find((cookie) => cookie.name === "focus_session");
  if (!session?.value) {
    const body = await response.text().catch(() => "");
    throw new Error(`Preview test login did not return a focus_session cookie. If this Preview is protected, set VERCEL_PROTECTION_BYPASS_SECRET for the smoke run. Response started with: ${body.slice(0, 80)}`);
  }
  return `focus_session=${encodeURIComponent(session!.value)}`;
}

async function installSessionCookie(page: Page, cookie: string) {
  const base = new URL(previewUrl ?? "http://127.0.0.1:3000");
  const [, value] = cookie.split("=");
  await page.context().addCookies([{
    name: "focus_session",
    value: decodeURIComponent(value),
    domain: base.hostname,
    path: "/",
    httpOnly: true,
    secure: base.protocol === "https:",
    sameSite: "Lax"
  }]);
}

async function api(request: APIRequestContext, cookie: string, method: "GET" | "POST", path: string, data?: unknown) {
  const response = await request.fetch(`${previewUrl}${path}`, {
    method,
    headers: { cookie, "content-type": "application/json", ...protectionHeaders() },
    data
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

function protectionHeaders() {
  return protectionBypass ? { "x-vercel-protection-bypass": protectionBypass } : {};
}

function koreaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
