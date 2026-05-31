import { CalendarBlock } from "@prisma/client";
import { db } from "../db";
import { ImportedCalendarEvent } from "./calendar-source";

export class CalendarRepository {
  constructor(private readonly ownerId = "local") {}

  async replace(events: ImportedCalendarEvent[]): Promise<CalendarBlock[]> {
    return Promise.all(events.map((event) => db.calendarBlock.upsert({
      where: { ownerId_externalId: { ownerId: this.ownerId, externalId: event.externalId } },
      create: { ...event, start: new Date(event.start), end: new Date(event.end), ownerId: this.ownerId },
      update: { title: event.title, start: new Date(event.start), end: new Date(event.end) }
    })));
  }

  async list(from: Date, to: Date): Promise<CalendarBlock[]> {
    return db.calendarBlock.findMany({
      where: { ownerId: this.ownerId, start: { lt: to }, end: { gt: from } },
      orderBy: { start: "asc" }
    });
  }
}
