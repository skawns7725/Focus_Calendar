import { useEffect } from "react";
import { Quest } from "@/domain/types";
import { captureProductEvent } from "@/client/analytics";
import { UnplacedReason } from "@/domain/auto-schedule-today";
import type { StudyBlock } from "@/domain/study-plan";
import { buildTodayFocusItems, type TodayFocusItem } from "@/domain/today-focus";
import { toLocalDate } from "@/domain/time-zone";
import { CheckIcon } from "./icons";

interface TodayFocusBlocksProps {
  quests: Quest[];
  studyBlocks?: StudyBlock[];
  onComplete(id: string): void;
  onCompleteStudyBlock?(id: string): void;
  onAdd?(): void;
  now?: Date;
  timeZone?: string;
  unplacedReasons?: Partial<Record<string, UnplacedReason>>;
}

export function TodayFocusBlocks({ quests, studyBlocks = [], onComplete, onCompleteStudyBlock, onAdd, now = new Date(), timeZone = "Asia/Seoul", unplacedReasons = {} }: TodayFocusBlocksProps) {
  const today = toLocalDate(now, timeZone);
  const blocks = buildTodayFocusItems({ quests, studyBlocks, today, now, timeZone });
  const unplaced = quests.filter((quest) => quest.kind === "flexible" && !quest.plannedStart && isActive(quest));
  const completedMinutes = completedFocusMinutes(quests, studyBlocks, today, timeZone);
  const remainingMinutes = blocks.reduce((total, item) => total + item.expectedMinutes, 0);
  const recommendedMinutes = completedMinutes + remainingMinutes;

  useEffect(() => {
    captureProductEvent("today_focus_viewed", {
      count: blocks.length,
      expectedMinutes: remainingMinutes,
      sourceType: blocks.some((item) => item.sourceType === "study_block") ? "mixed" : "quest"
    });
    if (Object.keys(unplacedReasons).length > 0) {
      captureProductEvent("calendar_conflict_detected", {
        count: Object.keys(unplacedReasons).length,
        reason: "unplaced"
      });
    }
  }, [blocks.length, remainingMinutes, unplacedReasons]);

  return (
    <section className="focus-blocks" aria-labelledby="focus-blocks-title" data-testid="today-focus">
      <div className="focus-blocks-heading">
        <div><p className="eyebrow">자동 배치</p><h2 id="focus-blocks-title">오늘의 집중 블록</h2></div>
        <p>할 일을 입력하면 활동 가능 시간의 빈 곳부터 채웁니다.</p>
      </div>
      <div className="focus-summary" aria-label="오늘 집중 요약">
        <span>오늘 추천 학습량: {recommendedMinutes}분</span>
        <span>완료: {completedMinutes}분 / 남은 계획: {remainingMinutes}분</span>
        <span>우선 기준: 마감일 + 중요도 + 예상 시간</span>
        {blocks[0] && <strong>다음 추천: {blocks[0].title}</strong>}
      </div>
      {blocks.length === 0 ? <FocusBlocksEmpty hasTasks={quests.some(isActive) || studyBlocks.some((block) => block.status === "pending" && block.date === today)} onAdd={onAdd} /> : <ol data-testid="today-focus-list">
        {blocks.map((item) => <li key={`${item.sourceType}-${item.id}`} data-testid="today-focus-item">
          <time>{formatFocusTime(item, timeZone)}</time>
          <div>
            <strong>{item.title}</strong>
            <span>{item.expectedMinutes}분</span>
            <span>{item.reason}</span>
          </div>
          <span className="focus-category">{categoryLabel(item.category)}</span>
          <span className="focus-status">{statusLabel(item)}</span>
          <button aria-label={`${item.title} 완료`} type="button" onClick={() => item.sourceType === "study_block" ? onCompleteStudyBlock?.(item.id) : onComplete(item.id)}><CheckIcon size={16} /></button>
        </li>)}
      </ol>}
      {unplaced.length > 0 && <section className="unplaced-tasks" aria-labelledby="unplaced-tasks-title">
        <div><h3 id="unplaced-tasks-title">배치하지 못한 할 일</h3><span>예상 시간을 줄이거나 활동 가능 시간을 조정해보세요.</span></div>
        <ul>{unplaced.map((quest) => <li key={quest.id}>
          <div><strong>{quest.title}</strong><span>{quest.expectedMinutes}분 · {categoryLabel(quest.category)}</span></div>
          <span>{unplacedReasonLabel(unplacedReasons[quest.id], quest.expectedMinutes)}</span>
        </li>)}</ul>
      </section>}
    </section>
  );
}

function FocusBlocksEmpty({ hasTasks, onAdd }: { hasTasks: boolean; onAdd?(): void }) {
  if (hasTasks) return <p className="focus-blocks-empty">오늘 배치할 수 있는 빈 시간이 없습니다.</p>;
  return <div className="focus-blocks-empty focus-blocks-onboarding">
    <strong>첫 할 일을 추가해보세요.</strong>
    <span>예: 열역학 5장 문제풀이 / 오늘 / 50분 / 중요도 높음</span>
    <p>마감일, 중요도, 예상 소요 시간을 기준으로 오늘의 빈 시간에 자동 배치합니다.</p>
    {onAdd && <button className="primary-button" type="button" onClick={onAdd}>첫 할 일 추가</button>}
  </div>;
}

function isActive(quest: Quest) {
  return quest.status !== "completed" && quest.status !== "abandoned";
}

function completedFocusMinutes(quests: Quest[], studyBlocks: StudyBlock[], today: string, timeZone: string) {
  const completedQuestMinutes = quests
    .filter((quest) => quest.status === "completed"
      && quest.plannedStart
      && toLocalDate(new Date(quest.plannedStart), timeZone) === today)
    .reduce((total, quest) => total + quest.expectedMinutes, 0);
  const completedStudyMinutes = studyBlocks
    .filter((block) => block.status === "completed" && block.date === today)
    .reduce((total, block) => total + block.durationMinutes, 0);
  return completedQuestMinutes + completedStudyMinutes;
}

function formatFocusTime(item: TodayFocusItem, timeZone: string) {
  if (!item.displayTime) return "오늘";
  const start = new Date(item.displayTime);
  const end = new Date(start.getTime() + item.expectedMinutes * 60_000);
  const formatter = new Intl.DateTimeFormat("ko-KR", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

function categoryLabel(category: Quest["category"]) {
  return category === "work" ? "업무" : category === "personal" ? "개인" : category === "study" ? "학습" : category === "health" ? "건강" : "기타";
}

function statusLabel(item: TodayFocusItem) {
  if (item.sourceType === "study_block") return "학습";
  return item.status === "overdue" ? "마감 지남" : item.status === "needs_attention" ? "확인 필요" : item.status === "due_today" ? "오늘" : "예정";
}

function unplacedReasonLabel(reason: UnplacedReason | undefined, expectedMinutes: number) {
  if (reason === "activity_hours_ended") return "오늘의 활동 가능 시간이 끝나 배치하지 못했습니다.";
  if (reason === "insufficient_total_time") return `오늘 남은 전체 시간이 ${expectedMinutes}분보다 부족합니다.`;
  return `${expectedMinutes}분을 넣을 수 있는 연속된 빈 시간이 부족합니다.`;
}
