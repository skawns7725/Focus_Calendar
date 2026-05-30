export interface ImportedCalendarEvent {
  externalId: string;
  title: string;
  start: string;
  end: string;
}

export interface CalendarSource {
  listEvents(from: string, to: string): Promise<ImportedCalendarEvent[]>;
}

