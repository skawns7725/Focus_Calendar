import { Quest, QuestCategory, QuestKind, QuestStatus, RecurrenceRule } from "@/domain/types";
import { db } from "../db";
import { SettingsRepository } from "../settings-repository";

export class PrismaGoogleSyncRepository {
  constructor(private readonly ownerId = "local", private readonly settings = new SettingsRepository(ownerId)) {}

  async getSettings() {
    const settings = await this.settings.get();
    return {
      twoWaySync: settings.twoWaySync,
      googleImportMode: settings.googleImportMode,
      selectedGoogleCalendarIds: settings.selectedGoogleCalendarIds
    };
  }

  enableTwoWaySync() {
    return this.settings.enableTwoWaySync();
  }

  async getCursor(calendarId: string) {
    return (await db.googleCalendarCursor.findUnique({ where: { ownerId_calendarId: { ownerId: this.ownerId, calendarId } } }))?.syncToken ?? null;
  }

  setCursor(calendarId: string, syncToken: string | null) {
    return db.googleCalendarCursor.upsert({
      where: { ownerId_calendarId: { ownerId: this.ownerId, calendarId } },
      create: { ownerId: this.ownerId, calendarId, syncToken },
      update: { syncToken }
    });
  }

  upsertBlock(block: { externalId: string; calendarId: string; googleEventId: string; title: string; start: string; end: string }) {
    return db.calendarBlock.upsert({
      where: { ownerId_externalId: { ownerId: this.ownerId, externalId: block.externalId } },
      create: { ...block, start: new Date(block.start), end: new Date(block.end), ownerId: this.ownerId },
      update: { ...block, start: new Date(block.start), end: new Date(block.end) }
    });
  }

  deleteBlock(calendarId: string, googleEventId: string) {
    return db.calendarBlock.deleteMany({ where: { ownerId: this.ownerId, calendarId, googleEventId } });
  }

  async listQuests(): Promise<Quest[]> {
    return (await db.quest.findMany({ where: { ownerId: this.ownerId } })).map((quest) => ({
      id: quest.id,
      title: quest.title,
      note: quest.note,
      location: quest.location,
      recurrenceRule: quest.recurrenceJson ? JSON.parse(quest.recurrenceJson) as RecurrenceRule : null,
      kind: quest.kind as QuestKind,
      deadline: quest.deadline.toISOString(),
      expectedMinutes: quest.expectedMinutes,
      category: normalizeCategory(quest.category),
      plannedStart: quest.plannedStart?.toISOString() ?? null,
      importance: quest.importance as 1 | 2 | 3,
      carryoverCount: quest.carryoverCount,
      lastCarryoverDate: quest.lastCarryoverDate,
      status: quest.status as QuestStatus
    }));
  }

  listMappings() {
    return db.googleEventMapping.findMany({ where: { ownerId: this.ownerId }, select: { questId: true, calendarId: true, googleEventId: true } });
  }

  saveMapping(mapping: { questId: string; calendarId: string; googleEventId: string }) {
    return db.googleEventMapping.upsert({ where: { ownerId_questId: { ownerId: this.ownerId, questId: mapping.questId } }, create: { ...mapping, ownerId: this.ownerId }, update: mapping });
  }

  deleteMapping(questId: string) {
    return db.googleEventMapping.deleteMany({ where: { ownerId: this.ownerId, questId } });
  }

  updateQuest(id: string, changes: Partial<Quest>) {
    const { recurrenceRule, ...fields } = changes;
    return db.quest.updateMany({
      where: { id, ownerId: this.ownerId },
      data: {
        ...fields,
        recurrenceJson: recurrenceRule === undefined ? undefined : recurrenceRule ? JSON.stringify(recurrenceRule) : null,
        deadline: changes.deadline ? new Date(changes.deadline) : undefined,
        plannedStart: changes.plannedStart ? new Date(changes.plannedStart) : changes.plannedStart
      }
    });
  }

  async deleteQuest(id: string) {
    await db.googleEventMapping.deleteMany({ where: { ownerId: this.ownerId, questId: id } });
    return db.quest.deleteMany({ where: { id, ownerId: this.ownerId } });
  }
}

function normalizeCategory(value: string | null | undefined): QuestCategory {
  return value === "work" || value === "personal" || value === "study" || value === "health" ? value : "other";
}
