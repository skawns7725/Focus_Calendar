import { Quest } from "@/domain/types";
import { sortQuests } from "@/domain/priority";
import { CheckIcon, PlusIcon } from "./icons";

export function NowPanel({ quests, onAdd, onComplete }: { quests: Quest[]; onAdd(): void; onComplete(id: string): void }) {
  const next = sortQuests(quests.filter((quest) => quest.status !== "completed" && quest.status !== "abandoned"))[0];

  if (!next) {
    return (
      <section className="now-panel now-panel-empty">
        <p className="eyebrow">오늘의 시작</p>
        <h2>해야 할 일을 가볍게 적어보세요.</h2>
        <p>마감일을 기준으로 가장 먼저 처리할 일을 정리해 드립니다.</p>
        <button className="primary-button" type="button" onClick={onAdd}><PlusIcon size={16} />첫 할 일 추가</button>
      </section>
    );
  }

  return (
    <section className="now-panel">
      <div>
        <p className="eyebrow">지금 할 일</p>
        <h2>{next.title}</h2>
        <p>{describeTiming(next)} · 예상 {next.expectedMinutes}분</p>
      </div>
      <button aria-label={`${next.title} 완료`} className="now-complete" type="button" onClick={() => onComplete(next.id)}><CheckIcon size={18} />완료</button>
    </section>
  );
}

function describeTiming(quest: Quest) {
  const value = quest.plannedStart ?? quest.deadline;
  const label = quest.plannedStart ? "예정" : "마감";
  return `${label} ${new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))}`;
}
