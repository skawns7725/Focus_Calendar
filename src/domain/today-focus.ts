import type { StudyBlock } from "./study-plan";
import { toLocalDate } from "./time-zone";
import type { Quest } from "./types";

export type TodayFocusSourceType = "quest" | "study_block";

export interface TodayFocusItem {
  sourceType: TodayFocusSourceType;
  id: string;
  title: string;
  expectedMinutes: number;
  category: Quest["category"];
  status: Quest["status"] | StudyBlock["status"];
  reason: string;
  sortTime: string | null;
  displayTime: string | null;
  importance: Quest["importance"];
  deadline: string | null;
  studyPlanId?: string;
  stage?: StudyBlock["stage"];
  sequence?: number;
}

export function buildTodayFocusItems(_input: {
  quests: Quest[];
  studyBlocks?: StudyBlock[];
  today: string;
  now?: Date;
  timeZone?: string;
}): TodayFocusItem[] {
  const timeZone = _input.timeZone ?? "Asia/Seoul";
  const questItems = _input.quests
    .filter((quest) => quest.plannedStart
      && quest.status !== "completed"
      && quest.status !== "abandoned"
      && toLocalDate(new Date(quest.plannedStart), timeZone) === _input.today)
    .map((quest): TodayFocusItem => ({
      sourceType: "quest",
      id: quest.id,
      title: quest.title,
      expectedMinutes: quest.expectedMinutes,
      category: quest.category,
      status: quest.status,
      reason: questReason(quest, _input.today),
      sortTime: quest.plannedStart,
      displayTime: quest.plannedStart,
      importance: quest.importance,
      deadline: quest.deadline
    }));
  const studyItems = (_input.studyBlocks ?? [])
    .filter((block) => block.date === _input.today && block.status === "pending")
    .map((block): TodayFocusItem => ({
      sourceType: "study_block",
      id: block.id,
      title: block.title,
      expectedMinutes: block.durationMinutes,
      category: "study",
      status: block.status,
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

function compareTodayFocusItems(a: TodayFocusItem, b: TodayFocusItem) {
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

function categoryPriority(category: Quest["category"]) {
  return category === "study" ? 4
    : category === "work" ? 3
      : category === "health" ? 2
        : category === "personal" ? 1
          : 0;
}

function questReason(quest: Quest, today: string) {
  const deadlineDate = toLocalDate(new Date(quest.deadline), "Asia/Seoul");
  if (deadlineDate <= today) return "마감일이 가까워요";
  if (quest.importance === 3) return "중요도가 높아요";
  if (quest.expectedMinutes <= 25) return "예상 시간이 짧아 지금 처리하기 좋아요";
  return "오늘 빈 시간에 자동 배치됐어요";
}
