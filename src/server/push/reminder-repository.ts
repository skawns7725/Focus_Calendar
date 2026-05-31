import { db } from "../db";

export class ReminderRepository {
  listDue(now: Date, reminderMinutes: number) {
    return db.quest.findMany({
      where: {
        status: { notIn: ["completed", "abandoned"] },
        plannedStart: { gt: now, lte: new Date(now.getTime() + reminderMinutes * 60000) }
      }
    });
  }

  async wasSent(questId: string, scheduledStart: string) {
    return Boolean(await db.reminderDelivery.findUnique({
      where: { questId_scheduledStart: { questId, scheduledStart: new Date(scheduledStart) } }
    }));
  }

  markSent(questId: string, scheduledStart: string) {
    return db.reminderDelivery.create({ data: { questId, scheduledStart: new Date(scheduledStart) } });
  }
}
