import { Prisma, Quest as StoredQuest } from "@prisma/client";
import { Quest, QuestKind, QuestStatus } from "@/domain/types";
import { db } from "./db";

export interface SaveQuestInput {
  title: string;
  note?: string | null;
  location?: string | null;
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
  delete(id: string): Promise<boolean>;
}

export class PrismaQuestRepository implements QuestRepository {
  constructor(private readonly ownerId = "local") {}

  async list(): Promise<Quest[]> {
    return (await db.quest.findMany({ where: { ownerId: this.ownerId } })).map(toQuest);
  }

  async save(input: SaveQuestInput): Promise<Quest> {
    return toQuest(await db.quest.create({
      data: {
        ...input,
        deadline: new Date(input.deadline),
        plannedStart: input.plannedStart ? new Date(input.plannedStart) : null,
        status: "scheduled",
        ownerId: this.ownerId
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
      const result = await db.quest.updateMany({ where: { id, ownerId: this.ownerId }, data });
      if (!result.count) return null;
      return toQuest(await db.quest.findFirstOrThrow({ where: { id, ownerId: this.ownerId } }));
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    return (await db.quest.deleteMany({ where: { id, ownerId: this.ownerId } })).count > 0;
  }
}

function toQuest(stored: StoredQuest): Quest {
  return {
    id: stored.id,
    title: stored.title,
    note: stored.note,
    location: stored.location,
    kind: stored.kind as QuestKind,
    deadline: stored.deadline.toISOString(),
    expectedMinutes: stored.expectedMinutes,
    plannedStart: stored.plannedStart?.toISOString() ?? null,
    importance: stored.importance as 1 | 2 | 3,
    carryoverCount: stored.carryoverCount,
    lastCarryoverDate: stored.lastCarryoverDate,
    status: stored.status as QuestStatus
  };
}
