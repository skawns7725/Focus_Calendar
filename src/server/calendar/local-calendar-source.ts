import { CalendarSource, ImportedCalendarEvent } from "./calendar-source";

export class LocalCalendarSource implements CalendarSource {
  constructor(private readonly events: ImportedCalendarEvent[] = []) {}

  async listEvents(from: string, to: string): Promise<ImportedCalendarEvent[]> {
    const fromTime = Date.parse(from);
    const toTime = Date.parse(to);

    return this.events.filter((event) => Date.parse(event.start) < toTime && Date.parse(event.end) > fromTime);
  }
}

