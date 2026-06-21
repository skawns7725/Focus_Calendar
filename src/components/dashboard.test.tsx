import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { completeQuest, getGoogleStatus, listQuests, reconcileSchedule, syncGoogleCalendar } from "@/client/api";
import { quest } from "@/test/factories";
import { Dashboard } from "./dashboard";

vi.mock("@/client/api", () => ({
  abandonQuest: vi.fn(),
  completeQuest: vi.fn(),
  completeStudyBlock: vi.fn(),
  createStudyPlan: vi.fn(),
  createQuest: vi.fn(),
  getGoogleStatus: vi.fn(async () => ({ connected: false })),
  getPushStatus: vi.fn(async () => ({ configured: false, notificationPromptCompleted: true })),
  listQuests: vi.fn(async () => [quest({ title: "로컬 일정 먼저 표시" })]),
  listStudyPlans: vi.fn(async () => []),
  listUnreadNotifications: vi.fn(async () => []),
  markNotificationsRead: vi.fn(),
  moveQuestToNearestDay: vi.fn(),
  reconcileSchedule: vi.fn(() => new Promise(() => undefined)),
  subscribePush: vi.fn(),
  syncGoogleCalendar: vi.fn(),
  unsubscribePush: vi.fn(),
  updateQuest: vi.fn()
}));

beforeEach(() => {
  vi.mocked(completeQuest).mockResolvedValue(quest({ status: "completed" }));
  vi.mocked(getGoogleStatus).mockResolvedValue({ connected: false });
  vi.mocked(listQuests).mockResolvedValue([quest({ title: "로컬 일정 먼저 표시" })]);
  vi.mocked(reconcileSchedule).mockImplementation(() => new Promise(() => undefined));
  vi.mocked(syncGoogleCalendar).mockResolvedValue(undefined);
});

afterEach(cleanup);

vi.mock("./app-shell", () => ({
  AppShell: ({ actions, children }: { actions?: React.ReactNode; children: React.ReactNode }) => <main>{actions}{children}</main>
}));

it("shows local quests before background reconciliation finishes", async () => {
  render(<Dashboard />);
  expect(await screen.findAllByText("로컬 일정 먼저 표시", {}, { timeout: 200 })).toHaveLength(2);
});

it("keeps the signed-out dashboard calm when quests cannot be loaded", async () => {
  vi.mocked(listQuests).mockRejectedValue(new Error("Sign in required"));
  render(<Dashboard />);

  expect(await screen.findByText("첫 할 일을 추가해보세요.")).toBeVisible();
  expect(screen.queryByText("현재 남아 있는 할 일이 없습니다.")).not.toBeInTheDocument();
});

it("shows a retry action when a connected Google Calendar sync fails", async () => {
  vi.mocked(getGoogleStatus).mockResolvedValue({ connected: true });
  vi.mocked(reconcileSchedule).mockResolvedValue(undefined);
  vi.mocked(syncGoogleCalendar).mockRejectedValue(new Error("Calendar unavailable"));

  render(<Dashboard />);

  expect(await screen.findByText("Google Calendar 일정을 가져오지 못했습니다. 연결 상태를 확인하고 다시 시도해 주세요.")).toBeVisible();
  expect(screen.getByRole("button", { name: "다시 시도" })).toBeVisible();
});

it("opens task creation in a dialog", async () => {
  render(<Dashboard />);
  fireEvent.click(screen.getByRole("button", { name: "할 일 추가" }));
  expect(screen.getByRole("dialog", { name: "할 일 추가" })).toBeVisible();
});

it("shows focus blocks before the dashboard summary with the requested empty guidance", async () => {
  vi.mocked(listQuests).mockResolvedValue([]);
  vi.mocked(reconcileSchedule).mockResolvedValue(undefined);
  render(<Dashboard />);

  const focusHeading = await screen.findByRole("heading", { name: "오늘의 집중 블록" });
  expect(focusHeading).toBeVisible();
  expect(focusHeading.closest("section")?.nextElementSibling).toHaveClass("dashboard-summary");
  expect(screen.getByText("첫 할 일을 추가해보세요.")).toBeVisible();
});

it("includes the study plan scheduler as a separate dashboard section", async () => {
  const { container } = render(<Dashboard />);

  const focusHeading = await screen.findByRole("heading", { name: "오늘의 집중 블록" });
  const studyHeading = screen.getByRole("heading", { name: "시험 공부계획" });
  expect(focusHeading.compareDocumentPosition(studyHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const nowPanel = container.querySelector(".now-panel");
  const studyPlanner = container.querySelector(".study-planner");
  expect(nowPanel).not.toBeNull();
  expect(studyPlanner).not.toBeNull();
  expect(nowPanel!.compareDocumentPosition(studyPlanner!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("removes a completed task immediately and keeps it hidden after refresh", async () => {
  const active = quest({ id: "finish-me", title: "완료할 보고서", plannedStart: new Date().toISOString() });
  const completed = { ...active, status: "completed" as const };
  let resolveCompletion!: (value: typeof completed) => void;
  vi.mocked(listQuests).mockResolvedValueOnce([active]).mockResolvedValue([completed]);
  vi.mocked(completeQuest).mockImplementation(() => new Promise((resolve) => { resolveCompletion = resolve; }));

  render(<Dashboard />);
  const buttons = await screen.findAllByRole("button", { name: "완료할 보고서 완료" });
  fireEvent.click(buttons[0]);

  expect(screen.queryAllByRole("button", { name: "완료할 보고서 완료" })).toHaveLength(0);
  resolveCompletion(completed);
});

it("does not restore a persisted completed task on a fresh render", async () => {
  vi.mocked(listQuests).mockResolvedValue([quest({ id: "done", title: "저장된 완료 항목", status: "completed" })]);
  vi.mocked(reconcileSchedule).mockResolvedValue(undefined);

  render(<Dashboard />);

  expect(await screen.findByText("첫 할 일을 추가해보세요.")).toBeVisible();
  expect(screen.queryByText("저장된 완료 항목")).not.toBeInTheDocument();
});

it("restores a task when completion persistence fails", async () => {
  const active = quest({ id: "restore-me", title: "복구할 작업", plannedStart: new Date().toISOString() });
  let rejectCompletion!: (reason: Error) => void;
  vi.mocked(listQuests).mockResolvedValue([active]);
  vi.mocked(completeQuest).mockImplementation(() => new Promise((_, reject) => { rejectCompletion = reject; }));

  render(<Dashboard />);
  const buttons = await screen.findAllByRole("button", { name: "복구할 작업 완료" });
  fireEvent.click(buttons[0]);

  expect(screen.queryAllByRole("button", { name: "복구할 작업 완료" })).toHaveLength(0);
  rejectCompletion(new Error("Save failed"));
  expect(await screen.findAllByRole("button", { name: "복구할 작업 완료" })).not.toHaveLength(0);
});
