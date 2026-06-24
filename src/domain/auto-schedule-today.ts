import { Quest } from "./types";
import { TimeBlock } from "./scheduling";
import { toInstant } from "./time-zone";

export interface TodayPlacement extends TimeBlock {
  questId: string;
}

export type UnplacedReason = "activity_hours_ended" | "no_continuous_slot" | "insufficient_total_time";

export interface TodayScheduleResult {
  placements: TodayPlacement[];
  unplaced: Array<{ questId: string; reason: UnplacedReason }>;
}

export interface AutoScheduleTodayInput {
  quests: Quest[];
  date: string;
  activityStart: string;
  activityEnd: string;
  fixedBlocks: TimeBlock[];
  timeZone: string;
  now?: Date;
  bufferMinutes?: number;
}

export function autoScheduleToday(input: AutoScheduleTodayInput): TodayPlacement[] {
  return autoScheduleTodayWithReasons(input).placements;
}

export function autoScheduleTodayWithReasons(input: AutoScheduleTodayInput): TodayScheduleResult {
  const activityStart = toInstant(input.date, input.activityStart, input.timeZone);
  const activityEnd = toInstant(input.date, input.activityEnd, input.timeZone);
  const notBefore = new Date(Math.max(activityStart.getTime(), input.now?.getTime() ?? activityStart.getTime()));
  const bufferMilliseconds = (input.bufferMinutes ?? 10) * 60_000;
  const occupied = input.fixedBlocks.map(toDates).sort((a, b) => a.start.getTime() - b.start.getTime());
  const candidates = input.quests
    .filter((quest) => quest.kind === "flexible" && !quest.plannedStart && quest.status !== "completed" && quest.status !== "abandoned")
    .sort((a, b) => Date.parse(a.deadline) - Date.parse(b.deadline) || b.importance - a.importance || a.expectedMinutes - b.expectedMinutes);
  const placements: TodayPlacement[] = [];
  const unplaced: TodayScheduleResult["unplaced"] = [];
  let scheduleCursor = notBefore;

  for (const quest of candidates) {
    const durationMilliseconds = quest.expectedMinutes * 60_000;
    const slot = findAvailableSlot(scheduleCursor, activityEnd, durationMilliseconds, occupied, bufferMilliseconds);
    if (!slot) {
      unplaced.push({
        questId: quest.id,
        reason: unplacedReason(scheduleCursor, activityEnd, durationMilliseconds, occupied, bufferMilliseconds)
      });
      continue;
    }
    const placement = { questId: quest.id, start: slot.start.toISOString(), end: slot.end.toISOString() };
    placements.push(placement);
    occupied.push(slot);
    occupied.sort((a, b) => a.start.getTime() - b.start.getTime());
    scheduleCursor = new Date(slot.end.getTime() + bufferMilliseconds);
  }

  return { placements, unplaced };
}

function unplacedReason(
  cursor: Date,
  activityEnd: Date,
  durationMilliseconds: number,
  occupied: Array<{ start: Date; end: Date }>,
  bufferMilliseconds: number
): UnplacedReason {
  if (cursor >= activityEnd) return "activity_hours_ended";
  const totalAvailable = availableWindows(cursor, activityEnd, occupied, bufferMilliseconds)
    .reduce((total, window) => total + window.end.getTime() - window.start.getTime(), 0);
  return totalAvailable < durationMilliseconds ? "insufficient_total_time" : "no_continuous_slot";
}

function availableWindows(
  initialCursor: Date,
  activityEnd: Date,
  occupied: Array<{ start: Date; end: Date }>,
  bufferMilliseconds: number
) {
  const windows: Array<{ start: Date; end: Date }> = [];
  let cursor = new Date(initialCursor);

  for (const block of occupied) {
    if (block.end <= cursor) continue;
    const windowEnd = new Date(Math.min(activityEnd.getTime(), block.start.getTime() - bufferMilliseconds));
    if (windowEnd > cursor) windows.push({ start: new Date(cursor), end: windowEnd });
    cursor = new Date(Math.max(cursor.getTime(), block.end.getTime() + bufferMilliseconds));
    if (cursor >= activityEnd) break;
  }
  if (cursor < activityEnd) windows.push({ start: cursor, end: activityEnd });
  return windows;
}

function findAvailableSlot(
  initialCursor: Date,
  activityEnd: Date,
  durationMilliseconds: number,
  occupied: Array<{ start: Date; end: Date }>,
  bufferMilliseconds: number
) {
  let cursor = new Date(initialCursor);

  for (const block of occupied) {
    if (block.end <= cursor) continue;
    const candidateEnd = new Date(cursor.getTime() + durationMilliseconds);
    if (candidateEnd <= activityEnd && candidateEnd.getTime() + bufferMilliseconds <= block.start.getTime()) {
      return { start: cursor, end: candidateEnd };
    }
    cursor = new Date(Math.max(cursor.getTime(), block.end.getTime() + bufferMilliseconds));
  }

  const end = new Date(cursor.getTime() + durationMilliseconds);
  return end <= activityEnd ? { start: cursor, end } : null;
}

function toDates(block: TimeBlock) {
  return { start: new Date(block.start), end: new Date(block.end) };
}
