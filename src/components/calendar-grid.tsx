export interface CalendarGridBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  source: "quest" | "calendar";
}

export function CalendarGrid({ blocks }: { blocks: CalendarGridBlock[] }) {
  return (
    <ol aria-label="시간표" className="calendar-grid">
      {blocks.length === 0 && <li className="calendar-empty">표시할 일정이 없습니다.</li>}
      {blocks.map((block) => <li key={block.id} data-source={block.source}><span>{format(block.start)} - {format(block.end)}</span><strong>{block.title}</strong><small>{block.source === "quest" ? "할 일" : "Google Calendar"}</small></li>)}
    </ol>
  );
}

function format(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
