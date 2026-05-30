export interface GoogleCalendarSummary {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface GoogleEventInput {
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  extendedProperties: { private: { focusCalendarQuestId: string } };
}

export function findDedicatedCalendar(calendars: GoogleCalendarSummary[]) {
  return calendars.find((calendar) => calendar.summary === "Focus Calendar" && !calendar.primary);
}

export class GoogleCalendarClient {
  constructor(private readonly accessToken: string) {}

  async ensureDedicatedCalendar(): Promise<GoogleCalendarSummary> {
    const calendars = await this.listCalendars();
    return findDedicatedCalendar(calendars) ?? this.request("/calendars", {
      method: "POST",
      body: JSON.stringify({ summary: "Focus Calendar", description: "Focus Calendar에서 관리하는 할 일 일정" })
    });
  }

  async listCalendars(): Promise<GoogleCalendarSummary[]> {
    const result = await this.request<{ items?: GoogleCalendarSummary[] }>("/users/me/calendarList");
    return result.items ?? [];
  }

  async listEvents(calendarId = "primary", timeMin = new Date().toISOString()) {
    return this.request<{ items?: unknown[] }>(`/calendars/${encodeURIComponent(calendarId)}/events?singleEvents=true&timeMin=${encodeURIComponent(timeMin)}`);
  }

  async createTaskEvent(calendarId: string, input: GoogleEventInput) {
    return this.request<{ id: string }>(`/calendars/${encodeURIComponent(calendarId)}/events`, { method: "POST", body: JSON.stringify(input) });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      ...init,
      headers: { authorization: `Bearer ${this.accessToken}`, "content-type": "application/json", ...init.headers }
    });
    if (!response.ok) throw new Error(`Google Calendar API request failed: ${response.status}`);
    return response.json() as Promise<T>;
  }
}

