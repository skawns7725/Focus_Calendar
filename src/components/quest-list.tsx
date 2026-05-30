import { Quest } from "@/domain/types";
import { sortQuests } from "@/domain/priority";
import { QuestCard } from "./quest-card";

export function QuestList({ quests, onComplete, onAbandon }: { quests: Quest[]; onComplete(id: string): void; onAbandon(id: string): void }) {
  const visible = sortQuests(quests.filter((quest) => quest.status !== "completed" && quest.status !== "abandoned"));
  if (visible.length === 0) {
    return <div className="empty-state"><p>현재 남아 있는 퀘스트가 없습니다.</p><strong>새 퀘스트를 추가해 오늘의 흐름을 만들어 보세요.</strong></div>;
  }
  return <section aria-label="우선순위 퀘스트" className="quest-list">{visible.map((quest) => <QuestCard key={quest.id} quest={quest} onComplete={onComplete} onAbandon={onAbandon} />)}</section>;
}

