import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { completeStudyBlock, createStudyPlan, listStudyPlans } from "@/client/api";
import { StudyBlock, StudyPlanView } from "@/domain/study-plan";
import { StudyPlanScheduler } from "./study-plan-scheduler";

vi.mock("@/client/api", () => ({
  completeStudyBlock: vi.fn(),
  createStudyPlan: vi.fn(),
  listStudyPlans: vi.fn()
}));

const today = todayString();
const tomorrow = offsetDate(1);

const plan: StudyPlanView = {
  id: "plan-1",
  examName: "기말고사",
  subject: "역사",
  examDate: "2026-07-01",
  scope: "1장-6장",
  progress: 10,
  difficulty: 3,
  dailyMinutes: 100,
  dDay: 3,
  risk: { level: "high", score: 150, reason: "시험일까지 남은 시간에 비해 진행률이 낮아 위험도가 높습니다." },
  blocks: [
    block("block-1", "오늘 개념학습", today, "concept", 1, "pending"),
    block("block-2", "오늘 문제풀이", today, "practice", 2, "pending"),
    block("block-3", "오늘 오답정리", today, "error_review", 3, "pending"),
    block("block-4", "오늘 최종복습", today, "final_review", 4, "pending"),
    block("block-5", "완료된 학습", today, "concept", 5, "completed"),
    block("block-6", "내일 학습", tomorrow, "practice", 6, "pending")
  ]
};

beforeEach(() => {
  vi.mocked(listStudyPlans).mockResolvedValue([plan]);
  vi.mocked(createStudyPlan).mockResolvedValue(plan);
  vi.mocked(completeStudyBlock).mockResolvedValue({ id: "block-1", status: "completed" });
});

afterEach(cleanup);

it("keeps the StudyPlan form collapsed until the user asks to create one", async () => {
  render(<StudyPlanScheduler />);

  expect(screen.getByRole("button", { name: "시험 공부계획 만들기" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByLabelText("시험명")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "시험 공부계획 만들기" }));

  expect(await screen.findByLabelText("시험명")).toBeVisible();
  expect(screen.getByRole("button", { name: "시험 공부계획 만들기" })).toHaveAttribute("aria-expanded", "true");
});

it("shows only today's unfinished StudyBlocks up to three by default", async () => {
  render(<StudyPlanScheduler />);

  expect(await screen.findByRole("heading", { name: "기말고사 · 역사" })).toBeVisible();
  expect(screen.getAllByTestId("study-block-item")).toHaveLength(3);
  expect(screen.getByText("오늘 개념학습 · 50분")).toBeVisible();
  expect(screen.getByText("오늘 문제풀이 · 50분")).toBeVisible();
  expect(screen.getByText("오늘 오답정리 · 50분")).toBeVisible();
  expect(screen.queryByText("오늘 최종복습 · 50분")).not.toBeInTheDocument();
  expect(screen.queryByText("완료된 학습 · 50분")).not.toBeInTheDocument();
  expect(screen.queryByText("내일 학습 · 50분")).not.toBeInTheDocument();
});

it("shows every StudyBlock only after expanding the full plan", async () => {
  render(<StudyPlanScheduler />);

  fireEvent.click(await screen.findByRole("button", { name: "전체 계획 보기" }));

  expect(screen.getAllByTestId("study-block-item")).toHaveLength(6);
  expect(screen.getByText("오늘 최종복습 · 50분")).toBeVisible();
  expect(screen.getByText("완료된 학습 · 50분")).toBeVisible();
  expect(screen.getByText("내일 학습 · 50분")).toBeVisible();
});

it("submits the exam form with numeric planning inputs", async () => {
  vi.mocked(listStudyPlans).mockResolvedValue([]);
  render(<StudyPlanScheduler />);

  fireEvent.click(screen.getByRole("button", { name: "시험 공부계획 만들기" }));
  fireEvent.change(screen.getByLabelText("시험명"), { target: { value: "기말고사" } });
  fireEvent.change(screen.getByLabelText("과목명"), { target: { value: "역사" } });
  fireEvent.change(screen.getByLabelText("시험일"), { target: { value: "2026-07-01" } });
  fireEvent.change(screen.getByLabelText("시험범위"), { target: { value: "1장-6장" } });
  fireEvent.change(screen.getByLabelText("현재 진행률(%)"), { target: { value: "10" } });
  fireEvent.change(screen.getByLabelText("난이도"), { target: { value: "3" } });
  fireEvent.change(screen.getByLabelText("하루 공부 가능 시간 (분)"), { target: { value: "100" } });
  fireEvent.click(screen.getByRole("button", { name: "공부계획 만들기" }));

  await waitFor(() => expect(createStudyPlan).toHaveBeenCalledWith({
    examName: "기말고사",
    subject: "역사",
    examDate: "2026-07-01",
    scope: "1장-6장",
    progress: 10,
    difficulty: 3,
    dailyMinutes: 100
  }));
});

it("updates a completed block immediately and restores it when saving fails", async () => {
  vi.mocked(completeStudyBlock).mockRejectedValue(new Error("save failed"));
  render(<StudyPlanScheduler />);

  fireEvent.click(await screen.findByRole("button", { name: "오늘 개념학습 완료" }));
  expect(screen.queryByRole("button", { name: "오늘 개념학습 완료" })).not.toBeInTheDocument();
  expect(await screen.findByRole("button", { name: "오늘 개념학습 완료" })).toBeVisible();
  expect(screen.getByText("완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.")).toBeVisible();
});

function block(id: string, title: string, date: string, stage: StudyBlock["stage"], sequence: number, status: StudyBlock["status"]): StudyBlock {
  return { id, studyPlanId: "plan-1", title, date, stage, durationMinutes: 50, sequence, status };
}

function todayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function offsetDate(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(value);
}
