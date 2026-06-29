import type { StudyBlock } from "./study-plan";
import { toLocalDate } from "./time-zone";
import type { Quest } from "./types";

export type TodayFocusSourceType = "quest" | "study_block";
export type TodayFocusExecutionStatus = "available_now" | "scheduled" | "delayed" | "needs_reschedule" | "completed";

export interface TodayFocusItem {
  sourceType: TodayFocusSourceType;
  id: string;
  title: string;
  expectedMinutes: number;
  category: Quest["category"];
  status: Quest["status"] | StudyBlock["status"];
  executionStatus: TodayFocusExecutionStatus;
  reason: string;
  sortTime: string | null;
  displayTime: string | null;
  importance: Quest["importance"];
  deadline: string | null;
  studyPlanId?: string;
  stage?: StudyBlock["stage"];
  sequence?: number;
}

export function buildTodayFocusItems(input: {
  quests: Quest[];
  studyBlocks?: StudyBlock[];
  today: string;
  now?: Date;
  timeZone?: string;
}): TodayFocusItem[] {
  const timeZone = input.timeZone ?? "Asia/Seoul";
  const now = input.now ?? new Date();
  const questItems = input.quests
    .filter((quest) => quest.plannedStart
      && quest.status !== "completed"
      && quest.status !== "abandoned"
      && toLocalDate(new Date(quest.plannedStart), timeZone) === input.today)
    .map((quest): TodayFocusItem => ({
      sourceType: "quest",
      id: quest.id,
      title: quest.title,
      expectedMinutes: quest.expectedMinutes,
      category: quest.category,
      status: quest.status,
      executionStatus: executionStatusForScheduledItem(quest.plannedStart, quest.expectedMinutes, now),
      reason: questReason(quest, input.today, timeZone),
      sortTime: quest.plannedStart,
      displayTime: quest.plannedStart,
      importance: quest.importance,
      deadline: quest.deadline
    }));
  const studyItems = (input.studyBlocks ?? [])
    .filter((block) => block.date === input.today && block.status === "pending")
    .map((block): TodayFocusItem => ({
      sourceType: "study_block",
      id: block.id,
      title: block.title,
      expectedMinutes: block.durationMinutes,
      category: "study",
      status: block.status,
      executionStatus: "available_now",
      reason: "오늘 계획된 학습 블록이에요",
      sortTime: null,
      displayTime: null,
      importance: 2,
      deadline: null,
      studyPlanId: block.studyPlanId,
      stage: block.stage,
      sequence: block.sequence
    }));

  return [...questItems, ...studyItems].sort(compareTodayFocusItems);
}

function executionStatusForScheduledItem(plannedStart: string | null, expectedMinutes: number, now: Date): TodayFocusExecutionStatus {
  if (!plannedStart) return "available_now";
  const start = new Date(plannedStart);
  const end = new Date(start.getTime() + expectedMinutes * 60_000);
  if (now < start) return "scheduled";
  if (now > end) return "needs_reschedule";
  if (now > start) return "delayed";
  return "available_now";
}

function compareTodayFocusItems(a: TodayFocusItem, b: TodayFocusItem) {
  return executionPriority(a.executionStatus) - executionPriority(b.executionStatus)
    || compareByScheduleAndPriority(a, b);
}

function compareByScheduleAndPriority(a: TodayFocusItem, b: TodayFocusItem) {
  if (a.sortTime && b.sortTime) return Date.parse(a.sortTime) - Date.parse(b.sortTime)
    || b.importance - a.importance
    || categoryPriority(b.category) - categoryPriority(a.category)
    || a.expectedMinutes - b.expectedMinutes;
  if (a.sortTime) return -1;
  if (b.sortTime) return 1;
  return (a.sequence ?? 0) - (b.sequence ?? 0)
    || b.importance - a.importance
    || categoryPriority(b.category) - categoryPriority(a.category)
    || a.expectedMinutes - b.expectedMinutes;
}

function executionPriority(status: TodayFocusExecutionStatus) {
  return status === "delayed" ? 0
    : status === "available_now" ? 1
      : status === "needs_reschedule" ? 2
        : status === "scheduled" ? 3
          : 4;
}

function categoryPriority(category: Quest["category"]) {
  return category === "study" ? 4
    : category === "work" ? 3
      : category === "health" ? 2
        : category === "personal" ? 1
          : 0;
}

function questReason(quest: Quest, today: string, timeZone: string) {
  const deadlineDate = toLocalDate(new Date(quest.deadline), timeZone);
  if (deadlineDate <= today) return "마감일이 가까워요";
  if (quest.importance === 3) return "중요도가 높아요";
  if (quest.expectedMinutes <= 25) return "예상 시간이 짧아 지금 처리하기 좋아요";
  return "오늘 빈 시간에 자동 배치되었어요";
}
