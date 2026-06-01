export interface CalendarGridBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  source: "quest" | "calendar";
}

export function CalendarGrid({ blocks, onSelectTask }: { blocks: CalendarGridBlock[]; onSelectTask?(id: string): void }) {
  return (
    <ol aria-label="시간표" className="calendar-grid">
      {blocks.length === 0 && <li className="calendar-empty">표시할 일정이 없습니다.</li>}
      {blocks.map((block) => <li key={block.id} data-source={block.source}>{block.source === "quest" && onSelectTask
        ? <button aria-label={`${block.title} 수정`} className="calendar-task-button" type="button" onClick={() => onSelectTask(block.id)}><span>{format(block.start)} - {format(block.end)}</span><strong>{block.title}</strong><small>할 일</small></button>
        : <><span>{format(block.start)} - {format(block.end)}</span><strong>{block.title}</strong><small>Google Calendar</small></>}</li>)}
    </ol>
  );
}

function format(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
