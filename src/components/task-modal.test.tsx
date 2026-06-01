import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TaskModal } from "./task-modal";

afterEach(cleanup);

it("shows the shared task editor as a dialog", () => {
  render(<TaskModal onClose={() => undefined} onSubmit={() => undefined} />);
  expect(screen.getByRole("dialog", { name: "할 일 추가" })).toBeVisible();
  expect(screen.getByLabelText("일정 제목")).toBeVisible();
});

it("closes from the close button and backdrop", () => {
  const onClose = vi.fn();
  render(<TaskModal onClose={onClose} onSubmit={() => undefined} />);

  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  fireEvent.click(screen.getByTestId("task-modal-backdrop"));

  expect(onClose).toHaveBeenCalledTimes(2);
});
