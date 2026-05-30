import { CalendarSource } from "./calendar-source";

export async function importCalendar(source: CalendarSource, from: string, to: string) {
  return source.listEvents(from, to);
}

