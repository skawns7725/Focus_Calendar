import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { SwipeActions } from "./swipe-actions";

afterEach(cleanup);

it("completes after a deliberate right swipe", () => {
  const onComplete = vi.fn();
  render(<SwipeActions onComplete={onComplete} onDelete={() => undefined} onEdit={() => undefined}><p>일정</p></SwipeActions>);

  const card = screen.getByTestId("swipe-card");
  fireEvent.touchStart(card, { touches: [{ clientX: 20 }] });
  fireEvent.touchMove(card, { touches: [{ clientX: 130 }] });
  fireEvent.touchEnd(card);

  expect(onComplete).toHaveBeenCalledTimes(1);
});

it("reveals edit and delete after a deliberate left swipe", () => {
  render(<SwipeActions onComplete={() => undefined} onDelete={() => undefined} onEdit={() => undefined}><p>일정</p></SwipeActions>);

  const card = screen.getByTestId("swipe-card");
  fireEvent.touchStart(card, { touches: [{ clientX: 150 }] });
  fireEvent.touchMove(card, { touches: [{ clientX: 20 }] });
  fireEvent.touchEnd(card);

  expect(screen.getByRole("button", { name: "수정" })).toBeVisible();
  expect(screen.getByRole("button", { name: "삭제" })).toBeVisible();
});

it("ignores a short horizontal drag", () => {
  const onComplete = vi.fn();
  render(<SwipeActions onComplete={onComplete} onDelete={() => undefined} onEdit={() => undefined}><p>일정</p></SwipeActions>);

  const card = screen.getByTestId("swipe-card");
  fireEvent.touchStart(card, { touches: [{ clientX: 20 }] });
  fireEvent.touchMove(card, { touches: [{ clientX: 42 }] });
  fireEvent.touchEnd(card);

  expect(onComplete).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: "삭제" })).not.toBeInTheDocument();
});
