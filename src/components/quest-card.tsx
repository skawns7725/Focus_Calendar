import { Quest } from "@/domain/types";
import { CheckIcon } from "./icons";
import { SlideToComplete } from "./slide-to-complete";
import { SwipeActions } from "./swipe-actions";

export function QuestCard({ quest, onComplete, onDelete, onNearestDate, onEdit }: { quest: Quest; onComplete(id: string): void; onDelete(id: string): void; onNearestDate(id: string): void; onEdit(id: string): void }) {
  const overdue = quest.status === "overdue" || new Date(quest.deadline) < new Date();
  return (
    <SwipeActions onComplete={() => onComplete(quest.id)} onDelete={() => onDelete(quest.id)} onEdit={() => onEdit(quest.id)}>
    <article className={`quest-card ${overdue ? "overdue" : ""}`} data-status={overdue ? "overdue" : quest.status}>
      <div className="quest-rank">{overdue ? "!" : quest.importance}</div>
      <div className="quest-copy">
        <div className="quest-topline">
          <span className={`quest-chip ${overdue ? "danger" : ""}`}>{overdue ? "마감 지남" : quest.kind === "fixed" ? "시작 시간 지정" : "자동 배치"}</span>
          {quest.carryoverCount > 0 && <span className="quest-chip muted">다음 날로 이동 {quest.carryoverCount}회</span>}
        </div>
        <h2>{quest.title}</h2>
        <div className="quest-meta">
          <span>예정 {formatDate(quest.plannedStart)}</span>
          <span>마감 {formatDate(quest.deadline)}</span>
          <span>{quest.expectedMinutes}분</span>
        </div>
        {quest.location && <p className="quest-location">장소 {quest.location}</p>}
        {quest.note && <p className="quest-note">{quest.note}</p>}
        {quest.status === "needs_attention" && <div className="overdue-actions"><button type="button" onClick={() => onNearestDate(quest.id)}>가장 가까운 날짜로 이동</button><button type="button" onClick={() => onEdit(quest.id)}>직접 수정</button></div>}
        {overdue && <div className="overdue-actions"><button type="button" onClick={() => onEdit(quest.id)}>일정 수정</button><button type="button" onClick={() => onDelete(quest.id)}>삭제</button></div>}
      </div>
      <button className="complete-button desktop-complete" type="button" onClick={() => onComplete(quest.id)}><CheckIcon size={16} />완료</button>
      <SlideToComplete onComplete={() => onComplete(quest.id)} />
    </article>
    </SwipeActions>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "자동 배치";
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
