import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { completeStudyBlock, createStudyPlan, listStudyPlans } from "@/client/api";
import { StudyPlanView } from "@/domain/study-plan";
import { StudyPlanScheduler } from "./study-plan-scheduler";

vi.mock("@/client/api", () => ({
  completeStudyBlock: vi.fn(),
  createStudyPlan: vi.fn(),
  listStudyPlans: vi.fn()
}));

const plan: StudyPlanView = {
  id: "plan-1",
  examName: "기말고사",
  subject: "열역학",
  examDate: "2026-06-25",
  scope: "1장부터 6장",
  progress: 10,
  difficulty: 3,
  dailyMinutes: 100,
  dDay: 3,
  risk: { level: "high", score: 150, reason: "시험일까지 남은 시간에 비해 진행률이 낮아 위험도가 높습니다." },
  blocks: [
    { id: "block-1", studyPlanId: "plan-1", title: "열역학 개념학습", date: "2026-06-22", stage: "concept", durationMinutes: 50, sequence: 1, status: "pending" },
    { id: "block-2", studyPlanId: "plan-1", title: "열역학 최종복습", date: "2026-06-24", stage: "final_review", durationMinutes: 30, sequence: 2, status: "completed" }
  ]
};

beforeEach(() => {
  vi.mocked(listStudyPlans).mockResolvedValue([plan]);
  vi.mocked(createStudyPlan).mockResolvedValue(plan);
  vi.mocked(completeStudyBlock).mockResolvedValue({ id: "block-1", status: "completed" });
});

afterEach(cleanup);

it("shows study plans with D-day, risk, scope, and dated stages", async () => {
  render(<StudyPlanScheduler />);

  expect(screen.getByText("Quest는 해야 할 목표, StudyPlan은 목표를 날짜별 학습 계획으로 쪼갠 것입니다.")).toBeVisible();
  expect(screen.getByText("StudyBlock은 오늘 실제로 처리할 학습 단위이며 Today Focus에도 이어집니다.")).toBeVisible();
  expect(await screen.findByRole("heading", { name: "기말고사 · 열역학" })).toBeVisible();
  expect(screen.getByText("D-3")).toBeVisible();
  expect(screen.getByText("위험도 높음")).toBeVisible();
  expect(screen.getByText("범위: 1장부터 6장")).toBeVisible();
  expect(screen.getByText("개념학습")).toBeVisible();
  expect(screen.getByText("최종복습")).toBeVisible();
  expect(screen.getByText("완료됨")).toBeVisible();
});

it("submits the exam form with numeric planning inputs", async () => {
  vi.mocked(listStudyPlans).mockResolvedValue([]);
  render(<StudyPlanScheduler />);

  fireEvent.change(screen.getByLabelText("시험명"), { target: { value: "기말고사" } });
  fireEvent.change(screen.getByLabelText("과목명"), { target: { value: "열역학" } });
  fireEvent.change(screen.getByLabelText("시험일"), { target: { value: "2026-06-25" } });
  fireEvent.change(screen.getByLabelText("시험범위"), { target: { value: "1장부터 6장" } });
  fireEvent.change(screen.getByLabelText("현재 진행률 (%)"), { target: { value: "10" } });
  fireEvent.change(screen.getByLabelText("난이도"), { target: { value: "3" } });
  fireEvent.change(screen.getByLabelText("하루 공부 가능 시간 (분)"), { target: { value: "100" } });
  fireEvent.click(screen.getByRole("button", { name: "공부계획 만들기" }));

  await waitFor(() => expect(createStudyPlan).toHaveBeenCalledWith({
    examName: "기말고사",
    subject: "열역학",
    examDate: "2026-06-25",
    scope: "1장부터 6장",
    progress: 10,
    difficulty: 3,
    dailyMinutes: 100
  }));
});

it("updates a completed block immediately and restores it when saving fails", async () => {
  vi.mocked(completeStudyBlock).mockRejectedValue(new Error("save failed"));
  render(<StudyPlanScheduler />);

  fireEvent.click(await screen.findByRole("button", { name: "열역학 개념학습 완료" }));
  expect(screen.queryByRole("button", { name: "열역학 개념학습 완료" })).not.toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "열역학 개념학습 완료" })).toBeVisible();
  expect(screen.getByText("완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.")).toBeVisible();
});
