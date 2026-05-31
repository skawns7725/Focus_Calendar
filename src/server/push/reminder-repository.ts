import { db } from "../db";

export class ReminderRepository {
  constructor(private readonly ownerId = "local") {}

  listDue(now: Date, reminderMinutes: number) {
    return db.quest.findMany({
      where: {
        status: { notIn: ["completed", "abandoned"] },
        ownerId: this.ownerId,
        plannedStart: { gt: now, lte: new Date(now.getTime() + reminderMinutes * 60000) }
      }
    });
  }

  async wasSent(questId: string, scheduledStart: string) {
    return Boolean(await db.reminderDelivery.findUnique({
      where: { ownerId_questId_scheduledStart: { ownerId: this.ownerId, questId, scheduledStart: new Date(scheduledStart) } }
    }));
  }

  markSent(questId: string, scheduledStart: string) {
    return db.reminderDelivery.create({ data: { ownerId: this.ownerId, questId, scheduledStart: new Date(scheduledStart) } });
  }
}
