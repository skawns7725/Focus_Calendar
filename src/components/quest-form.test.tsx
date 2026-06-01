import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { QuestForm } from "./quest-form";

afterEach(cleanup);

it("requires planned time only for fixed-time quests", () => {
  render(<QuestForm onSubmit={() => undefined} />);

  fireEvent.change(screen.getByLabelText("시간 설정"), { target: { value: "fixed" } });

  expect(screen.getByLabelText("시작")).toBeRequired();
});

it("submits familiar calendar fields with an optional note", () => {
  const onSubmit = vi.fn();
  render(<QuestForm onSubmit={onSubmit} />);

  fireEvent.change(screen.getByLabelText("일정 제목"), { target: { value: "병원 예약" } });
  fireEvent.change(screen.getByLabelText("메모"), { target: { value: "접수처에 먼저 방문" } });
  fireEvent.change(screen.getByLabelText("장소"), { target: { value: "서울 중앙병원" } });
  fireEvent.change(screen.getByLabelText("마감"), { target: { value: "2026-06-03T15:00" } });
  fireEvent.click(screen.getByRole("button", { name: "일정 추가" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    title: "병원 예약",
    note: "접수처에 먼저 방문",
    location: "서울 중앙병원"
  }));
});

it("lets the user cancel a new event", () => {
  const onCancel = vi.fn();
  render(<QuestForm onCancel={onCancel} onSubmit={() => undefined} />);
  fireEvent.click(screen.getByRole("button", { name: "취소" }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});

it("uses the same form for editing an existing event", () => {
  render(<QuestForm initialValue={{
    title: "병원 예약",
    note: "보험증",
    location: "서울 중앙병원",
    kind: "fixed",
    deadline: "2026-06-03T15:00:00+09:00",
    plannedStart: "2026-06-03T14:00:00+09:00",
    expectedMinutes: 60,
    importance: 2
  }} onCancel={() => undefined} onSubmit={() => undefined} />);

  expect(screen.getByLabelText("일정 제목")).toHaveValue("병원 예약");
  expect(screen.getByLabelText("메모")).toHaveValue("보험증");
  expect(screen.getByLabelText("장소")).toHaveValue("서울 중앙병원");
  expect(screen.getByRole("button", { name: "변경사항 저장" })).toBeVisible();
  expect(screen.getByRole("button", { name: "취소" })).toBeVisible();
});

it("submits a familiar repeat selection", () => {
  const onSubmit = vi.fn();
  render(<QuestForm onSubmit={onSubmit} />);

  fireEvent.change(screen.getByLabelText("일정 제목"), { target: { value: "평일 계획" } });
  fireEvent.change(screen.getByLabelText("마감"), { target: { value: "2026-06-03T15:00" } });
  fireEvent.change(screen.getByLabelText("반복"), { target: { value: "weekdays" } });
  fireEvent.click(screen.getByRole("button", { name: "일정 추가" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    recurrenceRule: { frequency: "weekdays" }
  }));
});
