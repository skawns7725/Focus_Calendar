import { Prisma, Quest as StoredQuest } from "@prisma/client";
import { Quest, QuestKind, QuestStatus } from "@/domain/types";
import { db } from "./db";

export interface SaveQuestInput {
  title: string;
  kind: QuestKind;
  deadline: string;
  expectedMinutes: number;
  plannedStart?: string | null;
  importance: 1 | 2 | 3;
}

export interface QuestRepository {
  list(): Promise<Quest[]>;
  save(input: SaveQuestInput): Promise<Quest>;
  update(id: string, changes: Partial<Quest>): Promise<Quest | null>;
}

export class PrismaQuestRepository implements QuestRepository {
  async list(): Promise<Quest[]> {
    return (await db.quest.findMany()).map(toQuest);
  }

  async save(input: SaveQuestInput): Promise<Quest> {
    return toQuest(await db.quest.create({
      data: {
        ...input,
        deadline: new Date(input.deadline),
        plannedStart: input.plannedStart ? new Date(input.plannedStart) : null,
        status: "scheduled"
      }
    }));
  }

  async update(id: string, changes: Partial<Quest>): Promise<Quest | null> {
    const data: Prisma.QuestUpdateInput = { ...changes };
    if (changes.deadline) data.deadline = new Date(changes.deadline);
    if (changes.plannedStart !== undefined) {
      data.plannedStart = changes.plannedStart ? new Date(changes.plannedStart) : null;
    }

    try {
      return toQuest(await db.quest.update({ where: { id }, data }));
    } catch {
      return null;
    }
  }
}

function toQuest(stored: StoredQuest): Quest {
  return {
    id: stored.id,
    title: stored.title,
    kind: stored.kind as QuestKind,
    deadline: stored.deadline.toISOString(),
    expectedMinutes: stored.expectedMinutes,
    plannedStart: stored.plannedStart?.toISOString() ?? null,
    importance: stored.importance as 1 | 2 | 3,
    carryoverCount: stored.carryoverCount,
    status: stored.status as QuestStatus
  };
}

