import { useEffect, useState } from "react";
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
  availableMinutes?: number;
}

export function TodayFocusBlocks({
  quests,
  studyBlocks = [],
  onComplete,
  onCompleteStudyBlock,
  onAdd,
  now = new Date(),
  timeZone = "Asia/Seoul",
  unplacedReasons = {},
  availableMinutes
}: TodayFocusBlocksProps) {
  const today = toLocalDate(now, timeZone);
  const blocks = buildTodayFocusItems({ quests, studyBlocks, today, now, timeZone });
  const visibleBlocks = blocks.slice(0, 3);
  const unplaced = quests.filter((quest) => quest.kind === "flexible" && !quest.plannedStart && isActive(quest));
  const [unplacedOpen, setUnplacedOpen] = useState(false);
  const completedMinutes = completedFocusMinutes(quests, studyBlocks, today, timeZone);
  const remainingMinutes = blocks.reduce((total, item) => total + item.expectedMinutes, 0);
  const recommendedMinutes = completedMinutes + remainingMinutes;
  const todayAvailableMinutes = availableMinutes ?? Math.max(remainingMinutes, recommendedMinutes);

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
        <div>
          <p className="eyebrow">Today Focus</p>
          <h2 id="focus-blocks-title">오늘 지금 할 일</h2>
        </div>
        <p>Quest와 StudyBlock을 마감일, 중요도, 예상 시간 기준으로 골라 지금 처리할 순서만 보여줍니다.</p>
      </div>
      <div className="focus-summary" aria-label="오늘 집중 요약">
        <span>오늘 추천 총 소요 시간: {recommendedMinutes}분</span>
        <span data-testid="today-available-minutes">추천 기준 시간: {todayAvailableMinutes}분</span>
        <span>완료: {completedMinutes}분 / 남은 계획: {remainingMinutes}분</span>
        <span>우선 기준: 마감일 + 중요도 + 예상 시간</span>
        {blocks[0] && <strong>다음 추천: {blocks[0].title}</strong>}
      </div>
      {blocks.length === 0 ? (
        <FocusBlocksEmpty hasTasks={quests.some(isActive) || studyBlocks.some((block) => block.status === "pending" && block.date === today)} onAdd={onAdd} />
      ) : (
        <ol className="focus-execution-list" data-testid="today-focus-list">
          {visibleBlocks.map((item, index) => (
            <FocusExecutionCard
              item={item}
              key={`${item.sourceType}-${item.id}`}
              label={index === 0 ? "지금 할 일" : "다음 할 일"}
              testId={index === 0 ? "current-focus-card" : "next-focus-card"}
              timeZone={timeZone}
              onComplete={() => item.sourceType === "study_block" ? onCompleteStudyBlock?.(item.id) : onComplete(item.id)}
            />
          ))}
        </ol>
      )}
      {unplaced.length > 0 && (
        <section className="unplaced-tasks" aria-labelledby="unplaced-tasks-title">
          <div className="unplaced-summary">
            <div>
              <h3 id="unplaced-tasks-title">배치하지 못한 일 {unplaced.length}개</h3>
              <span>빈 시간이 부족한 항목은 접어두고, 필요할 때 이유를 확인하세요.</span>
            </div>
            <button className="secondary-button" type="button" aria-expanded={unplacedOpen} onClick={() => setUnplacedOpen((open) => !open)}>{unplacedOpen ? "이유 접기" : "이유 보기"}</button>
          </div>
          {unplacedOpen && <ul>
            {unplaced.map((quest) => (
              <li key={quest.id}>
                <div>
                  <strong>{quest.title}</strong>
                  <span>{quest.expectedMinutes}분 · {categoryLabel(quest.category)}</span>
                </div>
                <span>{unplacedReasonLabel(unplacedReasons[quest.id], quest.expectedMinutes)}</span>
              </li>
            ))}
          </ul>}
        </section>
      )}
    </section>
  );
}

function FocusExecutionCard({ item, label, testId, timeZone, onComplete }: { item: TodayFocusItem; label: string; testId: string; timeZone: string; onComplete(): void }) {
  return (
    <li className={testId === "current-focus-card" ? "focus-card focus-card-current" : "focus-card"} data-testid="today-focus-item">
      <div className="focus-card-label">
        <span>{label}</span>
        <time>{formatFocusTime(item, timeZone)}</time>
      </div>
      <div className="focus-card-body" data-testid={testId}>
        <strong>{item.title}</strong>
        <p>{item.reason}</p>
        <div className="focus-card-meta">
          <span>{item.expectedMinutes}분</span>
          <span>{categoryLabel(item.category)}</span>
          <span>중요도 {item.importance}</span>
          <span>{statusLabel(item)}</span>
        </div>
      </div>
      <button aria-label={`${item.title} 완료`} type="button" onClick={onComplete}><CheckIcon size={16} /></button>
    </li>
  );
}

function FocusBlocksEmpty({ hasTasks, onAdd }: { hasTasks: boolean; onAdd?(): void }) {
  if (hasTasks) return <p className="focus-blocks-empty">오늘 배치할 수 있는 빈 시간이 없습니다.</p>;
  return <div className="focus-blocks-empty focus-blocks-onboarding">
    <strong>첫 할 일을 추가해보세요.</strong>
    <span>예: 역사 5장 문제풀이 / 오늘 / 50분 / 중요도 높음</span>
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
  return `${formatter.format(start)}-${formatter.format(end)}`;
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
