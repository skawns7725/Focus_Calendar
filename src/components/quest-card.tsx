import { Quest } from "@/domain/types";
import { SlideToComplete } from "./slide-to-complete";

export function QuestCard({ quest, onComplete, onAbandon }: { quest: Quest; onComplete(id: string): void; onAbandon(id: string): void }) {
  const overdue = quest.status === "overdue" || new Date(quest.deadline) < new Date();
  return (
    <article className={`quest-card ${overdue ? "overdue" : ""}`} data-status={overdue ? "overdue" : quest.status}>
      <div className="quest-rank">{overdue ? "!" : quest.importance}</div>
      <div className="quest-copy">
        <div className="quest-topline">
          <span className={`quest-chip ${overdue ? "danger" : ""}`}>{overdue ? "기한 초과" : quest.kind === "fixed" ? "시간 지정" : "유연한 퀘스트"}</span>
          {quest.carryoverCount > 0 && <span className="quest-chip muted">이월 {quest.carryoverCount}회</span>}
        </div>
        <h2>{quest.title}</h2>
        <div className="quest-meta">
          <span>예정 {formatDate(quest.plannedStart)}</span>
          <span>마감 {formatDate(quest.deadline)}</span>
          <span>{quest.expectedMinutes}분</span>
        </div>
        {overdue && <div className="overdue-actions"><button type="button">새 마감 설정</button><button type="button" onClick={() => onAbandon(quest.id)}>포기</button></div>}
      </div>
      <button className="complete-button desktop-complete" type="button" onClick={() => onComplete(quest.id)}>완료</button>
      <SlideToComplete onComplete={() => onComplete(quest.id)} />
    </article>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "자동 배치";
  return new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

