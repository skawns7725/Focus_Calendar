import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quest } from "@/test/factories";
import { CalendarPage } from "./calendar-page";

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

it("shows imported calendar blocks and scheduled quests instead of demo events", async () => {
  render(<CalendarPage mode="day" />);

  expect(await screen.findByText("실제 Google 일정")).toBeVisible();
  expect(screen.getByText("실제 배치 할 일")).toBeVisible();
  expect(screen.queryByText("팀 정기 회의")).not.toBeInTheDocument();
});
