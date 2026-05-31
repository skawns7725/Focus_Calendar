import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { quest } from "@/test/factories";
import { CalendarPage } from "./calendar-page";
import { listCalendarBlocks } from "@/client/api";

vi.mock("@/client/api", () => ({
  listCalendarBlocks: vi.fn(async () => {
    const start = new Date();
    start.setHours(10, 0, 0, 0);
    return [{
      id: "calendar-1",
      title: "실제 Google 일정",
      start: start.toISOString(),
      end: new Date(start.getTime() + 60 * 60_000).toISOString()
    }];
  }),
  listQuests: vi.fn(async () => {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    return [quest({
      id: "quest-1",
      title: "실제 배치 할 일",
      plannedStart: start.toISOString(),
      deadline: new Date(start.getTime() + 6 * 60 * 60_000).toISOString()
    })];
  })
}));

vi.mock("./app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>
}));

beforeEach(() => {
  vi.mocked(listCalendarBlocks).mockResolvedValue([{
    id: "calendar-1",
    title: "실제 Google 일정",
    start: todayAt(10).toISOString(),
    end: todayAt(11).toISOString()
  }]);
});

afterEach(cleanup);

it("shows imported calendar blocks and scheduled quests instead of demo events", async () => {
  render(<CalendarPage mode="day" />);

  expect(await screen.findByText("실제 Google 일정")).toBeVisible();
  expect(screen.getByText("실제 배치 할 일")).toBeVisible();
  expect(screen.queryByText("팀 정기 회의")).not.toBeInTheDocument();
});

it("offers Google connection when calendar loading requires sign-in", async () => {
  vi.mocked(listCalendarBlocks).mockRejectedValue(new Error("Sign in required"));
  render(<CalendarPage mode="day" />);

  expect(await screen.findByText("Google Calendar를 연결해 일정을 불러오세요.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Google Calendar 연결" })).toHaveAttribute("href", "/api/google/connect?mode=read");
});

function todayAt(hour: number) {
  const value = new Date();
  value.setHours(hour, 0, 0, 0);
  return value;
}
