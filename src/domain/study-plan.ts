export type StudyDifficulty = 1 | 2 | 3;
export type StudyRiskLevel = "low" | "medium" | "high";
export type StudyStage = "concept" | "practice" | "error_review" | "final_review";
export type StudyBlockStatus = "pending" | "completed";

export interface StudyBlock {
  id: string;
  studyPlanId: string;
  title: string;
  date: string;
  stage: StudyStage;
  durationMinutes: number;
  sequence: number;
  status: StudyBlockStatus;
}

export interface StudyPlan {
  id: string;
  examName: string;
  subject: string;
  examDate: string;
  scope: string;
  progress: number;
  difficulty: StudyDifficulty;
  dailyMinutes: number;
  blocks: StudyBlock[];
}

export interface StudyPlanView extends StudyPlan {
  dDay: number;
  risk: { level: StudyRiskLevel; score: number; reason: string };
}

export interface StudyBlockScheduleCandidate {
  sourceType: "study_block";
  sourceId: string;
  studyPlanId: string;
  title: string;
  date: string;
  expectedMinutes: number;
  category: "study";
  completed: false;
}

export function calculateDaysUntilExam(_examDate: string, _today: string): number {
  return Math.round((dateValue(_examDate) - dateValue(_today)) / 86_400_000);
}

export function calculateStudyRisk(_input: {
  progress: number;
  difficulty: StudyDifficulty;
  examDate: string;
  today: string;
}): { level: StudyRiskLevel; score: number; reason: string } {
  const days = calculateDaysUntilExam(_input.examDate, _input.today);
  const score = (100 - _input.progress)
    + (_input.difficulty === 3 ? 30 : _input.difficulty === 2 ? 15 : 0)
    + (days <= 3 ? 30 : days <= 7 ? 15 : 0);
  const level = score >= 100 ? "high" : score >= 60 ? "medium" : "low";
  const reason = level === "high"
    ? "시험일까지 남은 시간에 비해 진행률이 낮아 위험도가 높습니다."
    : level === "medium"
      ? "현재 속도를 유지하려면 날짜별 공부 블록을 꾸준히 완료해야 합니다."
      : "현재 진행률과 남은 날짜에 여유가 있습니다.";
  return { level, score, reason };
}

export function generateStudyBlocks(_input: {
  planId: string;
  examName: string;
  subject: string;
  examDate: string;
  progress: number;
  difficulty: StudyDifficulty;
  dailyMinutes: number;
  today: string;
}): Omit<StudyBlock, "id">[] {
  const days = calculateDaysUntilExam(_input.examDate, _input.today);
  if (days < 1) throw new Error("시험일은 내일 이후여야 합니다.");

  const dates = Array.from({ length: days }, (_, index) => addDays(_input.today, index));
  const dailyCapacity = Math.max(1, Math.floor(_input.dailyMinutes * 0.8));
  const difficultyMultiplier = _input.difficulty === 3 ? 1.2 : _input.difficulty === 2 ? 1 : 0.8;
  const recommendedMinutes = Math.max(
    40,
    Math.round(days * dailyCapacity * ((100 - _input.progress) / 100) * difficultyMultiplier)
  );
  const plannedMinutes = Math.min(days * dailyCapacity, recommendedMinutes);
  const stages: Array<{ stage: StudyStage; weight: number; label: string }> = [
    { stage: "concept", weight: 0.35, label: "개념학습" },
    { stage: "practice", weight: 0.35, label: "문제풀이" },
    { stage: "error_review", weight: 0.2, label: "오답정리" },
    { stage: "final_review", weight: 0.1, label: "최종복습" }
  ];
  const stageMinutes = allocateStageMinutes(plannedMinutes, stages.map((item) => item.weight));
  const remainingByDate = dates.map(() => dailyCapacity);
  const drafts: Omit<StudyBlock, "id">[] = [];
  let sequence = 1;

  stages.forEach((item, stageIndex) => {
    let remaining = stageMinutes[stageIndex];
    let dateIndex = item.stage === "final_review" ? dates.length - 1 : 0;
    while (remaining > 0) {
      while (dateIndex < dates.length && remainingByDate[dateIndex] === 0) dateIndex += 1;
      if (dateIndex >= dates.length) break;
      const durationMinutes = Math.min(remaining, remainingByDate[dateIndex]);
      drafts.push({
        studyPlanId: _input.planId,
        title: `${_input.subject} ${item.label}`,
        date: dates[dateIndex],
        stage: item.stage,
        durationMinutes,
        sequence,
        status: "pending"
      });
      sequence += 1;
      remaining -= durationMinutes;
      remainingByDate[dateIndex] -= durationMinutes;
      if (item.stage !== "final_review" && remainingByDate[dateIndex] === 0) dateIndex += 1;
    }
  });

  return drafts.sort((a, b) => a.date.localeCompare(b.date) || a.sequence - b.sequence)
    .map((block, index) => ({ ...block, sequence: index + 1 }));
}

export function toStudyBlockScheduleCandidates(
  _blocks: StudyBlock[],
  _date: string
): StudyBlockScheduleCandidate[] {
  return _blocks
    .filter((block) => block.date === _date && block.status === "pending")
    .sort((a, b) => a.sequence - b.sequence)
    .map((block) => ({
      sourceType: "study_block",
      sourceId: block.id,
      studyPlanId: block.studyPlanId,
      title: block.title,
      date: block.date,
      expectedMinutes: block.durationMinutes,
      category: "study",
      completed: false
    }));
}

function dateValue(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(date: string, days: number) {
  return new Date(dateValue(date) + days * 86_400_000).toISOString().slice(0, 10);
}

function allocateStageMinutes(total: number, weights: number[]) {
  const raw = weights.map((weight) => total * weight);
  const allocated = raw.map(Math.floor);
  let remainder = total - allocated.reduce((sum, value) => sum + value, 0);
  const order = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (let index = 0; index < remainder; index += 1) allocated[order[index % order.length].index] += 1;
  return allocated;
}
