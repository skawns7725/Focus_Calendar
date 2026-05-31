import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quest } from "@/test/factories";
import { NowPanel } from "./now-panel";

it("shows the first prioritized quest and completes it directly", () => {
  const onComplete = vi.fn();
  render(<NowPanel quests={[
    quest({ id: "later", title: "나중 일정", deadline: "2099-06-03T18:00:00+09:00" }),
    quest({ id: "next", title: "지금 일정", deadline: "2099-06-02T18:00:00+09:00" })
  ]} onAdd={() => undefined} onComplete={onComplete} />);

  expect(screen.getByRole("heading", { name: "지금 일정" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "지금 일정 완료" }));
  expect(onComplete).toHaveBeenCalledWith("next");
});

it("offers task creation when there is no unfinished work", () => {
  const onAdd = vi.fn();
  render(<NowPanel quests={[]} onAdd={onAdd} onComplete={() => undefined} />);

  fireEvent.click(screen.getByRole("button", { name: "첫 할 일 추가" }));
  expect(onAdd).toHaveBeenCalled();
});
