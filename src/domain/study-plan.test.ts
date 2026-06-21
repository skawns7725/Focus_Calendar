import { describe, expect, it } from "vitest";
import {
  calculateDaysUntilExam,
  calculateStudyRisk,
  generateStudyBlocks,
  toStudyBlockScheduleCandidates
} from "./study-plan";

describe("Study Plan Scheduler domain", () => {
  it("calculates D-day from local calendar dates", () => {
    expect(calculateDaysUntilExam("2026-06-30", "2026-06-22")).toBe(8);
  });

  it("marks a difficult, low-progress, imminent exam as high risk", () => {
    expect(calculateStudyRisk({
      progress: 10,
      difficulty: 3,
      examDate: "2026-06-25",
      today: "2026-06-22"
    })).toMatchObject({ level: "high", score: 150 });
  });

  it("marks a well-progressed exam with enough time as low risk", () => {
    expect(calculateStudyRisk({
      progress: 85,
      difficulty: 1,
      examDate: "2026-07-10",
      today: "2026-06-22"
    })).toMatchObject({ level: "low", score: 15 });
  });

  it("generates ordered daily blocks for all four study stages", () => {
    const blocks = generateStudyBlocks({
      planId: "plan-1",
      examName: "기말고사",
      subject: "열역학",
      examDate: "2026-06-26",
      progress: 0,
      difficulty: 2,
      dailyMinutes: 100,
      today: "2026-06-22"
    });

    expect([...new Set(blocks.map((block) => block.stage))]).toEqual([
      "concept",
      "practice",
      "error_review",
      "final_review"
    ]);
    expect(blocks.every((block) => block.durationMinutes <= 80)).toBe(true);
    expect(blocks.every((block) => block.date >= "2026-06-22" && block.date < "2026-06-26")).toBe(true);
    expect(blocks.at(-1)).toMatchObject({ stage: "final_review", date: "2026-06-25" });
    expect(blocks.map((block) => block.sequence)).toEqual(blocks.map((_, index) => index + 1));
  });

  it("rejects an exam date without a future study day", () => {
    expect(() => generateStudyBlocks({
      planId: "plan-1",
      examName: "오늘 시험",
      subject: "수학",
      examDate: "2026-06-22",
      progress: 20,
      difficulty: 2,
      dailyMinutes: 60,
      today: "2026-06-22"
    })).toThrow("시험일은 내일 이후여야 합니다.");
  });

  it("excludes completed and other-date blocks from auto-schedule candidates", () => {
    const candidates = toStudyBlockScheduleCandidates([
      { id: "pending-today", studyPlanId: "plan-1", title: "개념학습", date: "2026-06-22", stage: "concept", durationMinutes: 40, sequence: 1, status: "pending" },
      { id: "done-today", studyPlanId: "plan-1", title: "문제풀이", date: "2026-06-22", stage: "practice", durationMinutes: 40, sequence: 2, status: "completed" },
      { id: "pending-tomorrow", studyPlanId: "plan-1", title: "오답정리", date: "2026-06-23", stage: "error_review", durationMinutes: 30, sequence: 3, status: "pending" }
    ], "2026-06-22");

    expect(candidates).toEqual([{
      sourceType: "study_block",
      sourceId: "pending-today",
      studyPlanId: "plan-1",
      title: "개념학습",
      date: "2026-06-22",
      expectedMinutes: 40,
      category: "study",
      completed: false
    }]);
  });
});
