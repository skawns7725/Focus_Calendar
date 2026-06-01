import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { quest } from "@/test/factories";
import { QuestList } from "./quest-list";

it("shows overdue quests first with resolution actions", () => {
  render(
    <QuestList
      quests={[
        quest({ id: "a", title: "Normal", deadline: "2099-06-02T18:00:00+09:00" }),
        quest({ id: "b", title: "Late", deadline: "2000-06-02T18:00:00+09:00", status: "overdue" })
      ]}
      onComplete={() => undefined}
      onDelete={() => undefined}
      onNearestDate={() => undefined}
      onEdit={() => undefined}
    />
  );

  expect(screen.getAllByRole("article")[0]).toHaveTextContent("Late");
  expect(screen.getByRole("button", { name: "일정 수정" })).toBeVisible();
  expect(screen.getByRole("button", { name: "삭제" })).toBeVisible();
});
