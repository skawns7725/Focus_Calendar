import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AttentionPanel } from "./attention-panel";

it("keeps notification details collapsed until the user expands them", () => {
  const onRead = vi.fn();
  render(<AttentionPanel notifications={[{ id: "n1", kind: "conflict", questId: "q1", message: "다음 날 일정이 가득 찼습니다." }]} onRead={onRead} />);

  expect(screen.getByRole("heading", { name: "일정 변경 알림" })).toBeInTheDocument();
  expect(screen.getByText("1개의 변경이 있어요. 오늘 순서가 바뀌었을 수 있습니다.")).toBeInTheDocument();
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
