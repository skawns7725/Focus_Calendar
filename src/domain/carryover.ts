import { Quest } from "./types";
import { QuestNotification } from "./notifications";
import { TimeBlock } from "./scheduling";

interface ReconcileInput {
  today: string;
  nextDaySlot: TimeBlock | null;
}

interface ReconcileResult {
  quest: Quest;
  notification: QuestNotification | null;
}

export function reconcileQuest(quest: Quest, input: ReconcileInput): ReconcileResult {
  const plannedDate = quest.plannedStart?.slice(0, 10);

  if (plannedDate === input.today) {
    return {
      quest: { ...quest, status: "due_today" },
      notification: null
    };
  }

  if (input.nextDaySlot) {
    return {
      quest: {
        ...quest,
        plannedStart: input.nextDaySlot.start,
        carryoverCount: quest.carryoverCount + 1,
        status: "scheduled"
      },
      notification: {
        kind: "carried_over",
        questId: quest.id,
        message: `${quest.title} moved to ${input.nextDaySlot.start}`
      }
    };
  }

  return {
    quest: { ...quest, status: "needs_attention" },
    notification: {
      kind: "conflict",
      questId: quest.id,
      message: `${quest.title} needs rescheduling`
    }
  };
}

