import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CalendarGrid } from "./calendar-grid";

it("opens Focus Calendar tasks but leaves imported events read-only", () => {
  const onSelectTask = vi.fn();
  render(<CalendarGrid blocks={[
    { id: "quest-1", title: "보고서 작성", start: "2026-06-01T09:00:00+09:00", end: "2026-06-01T10:00:00+09:00", source: "quest" },
    { id: "calendar-1", title: "외부 회의", start: "2026-06-01T11:00:00+09:00", end: "2026-06-01T12:00:00+09:00", source: "calendar" }
  ]} onSelectTask={onSelectTask} />);

  fireEvent.click(screen.getByRole("button", { name: "보고서 작성 수정" }));
  expect(onSelectTask).toHaveBeenCalledWith("quest-1");
  expect(screen.queryByRole("button", { name: "외부 회의 수정" })).not.toBeInTheDocument();
});
