import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AttentionPanel } from "./attention-panel";

it("shows persisted carryover notifications", () => {
  render(<AttentionPanel notifications={[{ id: "n1", kind: "conflict", questId: "q1", message: "다음 날 일정이 가득 찼습니다." }]} onRead={vi.fn()} />);
  expect(screen.getByText("다음 날 일정이 가득 찼습니다.")).toBeInTheDocument();
});
