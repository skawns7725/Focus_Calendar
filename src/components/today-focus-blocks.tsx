import { Quest } from "@/domain/types";
import { UnplacedReason } from "@/domain/auto-schedule-today";
import { toLocalDate } from "@/domain/time-zone";
import { CheckIcon } from "./icons";

interface TodayFocusBlocksProps {
  quests: Quest[];
  onComplete(id: string): void;
  onAdd?(): void;
  now?: Date;
  timeZone?: string;
  unplacedReasons?: Partial<Record<string, UnplacedReason>>;
}

export function TodayFocusBlocks({ quests, onComplete, onAdd, now = new Date(), timeZone = "Asia/Seoul", unplacedReasons = {} }: TodayFocusBlocksProps) {
  const today = toLocalDate(now, timeZone);
  const blocks = quests
    .filter((quest) => quest.plannedStart
      && quest.status !== "completed"
      && quest.status !== "abandoned"
      && toLocalDate(new Date(quest.plannedStart), timeZone) === today)
    .sort((a, b) => Date.parse(a.plannedStart!) - Date.parse(b.plannedStart!));
  const unplaced = quests.filter((quest) => quest.kind === "flexible" && !quest.plannedStart && isActive(quest));

  return (
    <section className="focus-blocks" aria-labelledby="focus-blocks-title">
      <div className="focus-blocks-heading">
        <div><p className="eyebrow">자동 배치</p><h2 id="focus-blocks-title">오늘의 집중 블록</h2></div>
        <p>할 일을 입력하면 활동 가능 시간의 빈 곳부터 채웁니다.</p>
      </div>
      {blocks.length === 0 ? <FocusBlocksEmpty hasTasks={quests.some(isActive)} onAdd={onAdd} /> : <ol>
        {blocks.map((quest) => <li key={quest.id}>
          <time>{formatRange(quest, timeZone)}</time>
          <div>
            <strong>{quest.title}</strong>
            <span>{quest.expectedMinutes}분</span>
            <span>마감일과 중요도를 기준으로 배치했습니다.</span>
          </div>
          <span className="focus-category">{categoryLabel(quest.category)}</span>
          <span className="focus-status">{statusLabel(quest.status)}</span>
          <button aria-label={`${quest.title} 완료`} type="button" onClick={() => onComplete(quest.id)}><CheckIcon size={16} /></button>
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

function formatRange(quest: Quest, timeZone: string) {
  const start = new Date(quest.plannedStart!);
  const end = new Date(start.getTime() + quest.expectedMinutes * 60_000);
  const formatter = new Intl.DateTimeFormat("ko-KR", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${formatter.format(start)}–${formatter.format(end)}`;
}

function categoryLabel(category: Quest["category"]) {
  return category === "work" ? "업무" : category === "personal" ? "개인" : category === "study" ? "학습" : category === "health" ? "건강" : "기타";
}

function statusLabel(status: Quest["status"]) {
  return status === "overdue" ? "마감 지남" : status === "needs_attention" ? "확인 필요" : status === "due_today" ? "오늘" : "예정";
}

function unplacedReasonLabel(reason: UnplacedReason | undefined, expectedMinutes: number) {
  if (reason === "activity_hours_ended") return "오늘의 활동 가능 시간이 끝나 배치하지 못했습니다.";
  if (reason === "insufficient_total_time") return `오늘 남은 전체 시간이 ${expectedMinutes}분보다 부족합니다.`;
  return `${expectedMinutes}분을 넣을 수 있는 연속된 빈 시간이 부족합니다.`;
}
