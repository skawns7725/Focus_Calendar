import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AttentionPanel } from "./attention-panel";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("keeps notification details collapsed until the user expands them", () => {
  const onRead = vi.fn();
  render(<AttentionPanel notifications={[{ id: "n1", kind: "conflict", questId: "q1", message: "다음 날 일정이 가득 찼습니다." }]} onRead={onRead} />);

  expect(screen.getByRole("heading", { name: "일정 변경 알림" })).toBeInTheDocument();
  expect(screen.getByText("오늘 일정 변경 1건 있음")).toBeInTheDocument();
  expect(screen.queryByText("다음 날 일정이 가득 찼습니다.")).not.toBeInTheDocument();

  const toggle = screen.getByRole("button", { name: "변경 내역 보기" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");

  fireEvent.click(toggle);
  expect(screen.getByRole("button", { name: "변경 내역 접기" })).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByTestId("schedule-change-details")).toBeInTheDocument();
  expect(screen.getByText("다음 날 일정이 가득 찼습니다.")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "변경 내역 접기" }));
  expect(screen.getByRole("button", { name: "변경 내역 보기" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("다음 날 일정이 가득 찼습니다.")).not.toBeInTheDocument();
});

it("turns internal moved-to UTC messages into user-facing Korean copy", () => {
  vi.setSystemTime(new Date("2026-06-28T00:00:00.000Z"));
  render(<AttentionPanel
    notifications={[{ id: "n1", kind: "rescheduled", questId: "q1", message: "재료역학 moved to 2026-06-28T01:20:00.000Z" }]}
    onRead={() => undefined}
  />);

  fireEvent.click(screen.getByRole("button", { name: "변경 내역 보기" }));

  expect(screen.queryByText("재료역학 moved to 2026-06-28T01:20:00.000Z")).not.toBeInTheDocument();
  expect(screen.getByText("재료역학이(가) 오늘 10:20으로 이동되었습니다. Calendar에서 위치를 확인하세요.")).toBeVisible();
});
