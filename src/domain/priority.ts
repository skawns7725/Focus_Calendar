import { Quest } from "./types";

export function sortQuests(quests: Quest[], now = new Date()): Quest[] {
  return [...quests].sort((a, b) => {
    const overdueDifference = Number(new Date(b.deadline) < now) - Number(new Date(a.deadline) < now);

    return overdueDifference
      || new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      || b.importance - a.importance
      || b.carryoverCount - a.carryoverCount;
  });
}

