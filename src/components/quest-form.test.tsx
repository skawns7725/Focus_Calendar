import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { QuestForm } from "./quest-form";

it("requires planned time only for fixed-time quests", () => {
  render(<QuestForm onSubmit={() => undefined} />);

  fireEvent.change(screen.getByLabelText("유형"), { target: { value: "fixed" } });

  expect(screen.getByLabelText("실행 예정 시각")).toBeRequired();
});

