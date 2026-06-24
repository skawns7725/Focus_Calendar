import { Quest } from "@/domain/types";
import { sortQuests } from "@/domain/priority";
import { QuestCard } from "./quest-card";

export function QuestList({ quests, onComplete, onDelete, onNearestDate, onEdit }: { quests: Quest[]; onComplete(id: string): void; onDelete(id: string): void; onNearestDate(id: string): void; onEdit(id: string): void }) {
  const visible = sortQuests(quests.filter((quest) => quest.status !== "completed" && quest.status !== "abandoned"));
  if (visible.length === 0) {
    return <div className="empty-state"><p>현재 남아 있는 할 일이 없습니다.</p><strong>새 할 일을 추가해 일정을 정리해 보세요.</strong></div>;
  }
  return <section aria-label="우선순위 할 일" className="quest-list" data-testid="quest-list">{visible.map((quest) => <QuestCard key={quest.id} quest={quest} onComplete={onComplete} onDelete={onDelete} onNearestDate={onNearestDate} onEdit={onEdit} />)}</section>;
}
