export interface TimeBlock {
  start: string;
  end: string;
}

export interface SlotRequest {
  date: string;
  durationMinutes: number;
  activityStart: string;
  activityEnd: string;
  fixedBlocks: TimeBlock[];
  timeZoneOffset: string;
}

export function findEarliestSlot(input: SlotRequest): TimeBlock | null {
  const activityStart = new Date(`${input.date}T${input.activityStart}:00${input.timeZoneOffset}`);
  const activityEnd = new Date(`${input.date}T${input.activityEnd}:00${input.timeZoneOffset}`);
  const requiredMilliseconds = input.durationMinutes * 60_000;
  const blocks = [...input.fixedBlocks].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  let cursor = activityStart;

  for (const block of blocks) {
    const blockStart = new Date(block.start);
    if (blockStart.getTime() - cursor.getTime() >= requiredMilliseconds) {
      return toTimeBlock(cursor, requiredMilliseconds);
    }

    const blockEnd = new Date(block.end);
    if (blockEnd > cursor) {
      cursor = blockEnd;
    }
  }

  return activityEnd.getTime() - cursor.getTime() >= requiredMilliseconds
    ? toTimeBlock(cursor, requiredMilliseconds)
    : null;
}

function toTimeBlock(start: Date, durationMilliseconds: number): TimeBlock {
  return {
    start: start.toISOString(),
    end: new Date(start.getTime() + durationMilliseconds).toISOString()
  };
}

