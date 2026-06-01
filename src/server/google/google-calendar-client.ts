export interface GoogleCalendarSummary {
  id: string;
  summary: string;
  primary?: boolean;
}

export interface GoogleEventInput {
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  extendedProperties: { private: { focusCalendarQuestId: string } };
}

export interface GoogleCalendarEvent {
  id: string;
  status?: string;
  summary?: string;
  updated?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: { focusCalendarQuestId?: string } };
}

export interface GoogleEventPage {
  items?: GoogleCalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export interface GoogleCalendarGateway {
  ensureDedicatedCalendar(): Promise<GoogleCalendarSummary>;
  listCalendars(): Promise<GoogleCalendarSummary[]>;
  listEvents(calendarId: string, options?: { syncToken?: string; pageToken?: string; timeMin?: string; timeMax?: string }): Promise<GoogleEventPage>;
  createTaskEvent(calendarId: string, input: GoogleEventInput): Promise<{ id: string }>;
  updateTaskEvent(calendarId: string, eventId: string, input: GoogleEventInput): Promise<{ id: string }>;
  deleteTaskEvent(calendarId: string, eventId: string): Promise<void>;
}

export class GoogleSyncTokenExpiredError extends Error {}

export function findDedicatedCalendar(calendars: GoogleCalendarSummary[]) {
  return calendars.find((calendar) => calendar.summary === "Focus Calendar" && !calendar.primary);
}

export class GoogleCalendarClient implements GoogleCalendarGateway {
  constructor(private readonly accessToken: string, private readonly requestFn: typeof fetch = fetch) {}

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

  async listEvents(calendarId = "primary", options: { syncToken?: string; pageToken?: string; timeMin?: string; timeMax?: string } = {}) {
    const params = new URLSearchParams({ singleEvents: "true" });
    if (options.syncToken) params.set("syncToken", options.syncToken);
    if (options.pageToken) params.set("pageToken", options.pageToken);
    if (options.timeMin) params.set("timeMin", options.timeMin);
    if (options.timeMax) params.set("timeMax", options.timeMax);
    return this.request<GoogleEventPage>(`/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`);
  }

  async createTaskEvent(calendarId: string, input: GoogleEventInput) {
    return this.request<{ id: string }>(`/calendars/${encodeURIComponent(calendarId)}/events`, { method: "POST", body: JSON.stringify(input) });
  }

  async updateTaskEvent(calendarId: string, eventId: string, input: GoogleEventInput) {
    return this.request<{ id: string }>(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  async deleteTaskEvent(calendarId: string, eventId: string) {
    await this.request<void>(`/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.requestFn(`https://www.googleapis.com/calendar/v3${path}`, {
      ...init,
      headers: { authorization: `Bearer ${this.accessToken}`, "content-type": "application/json", ...init.headers }
    });
    if (response.status === 410) throw new GoogleSyncTokenExpiredError("Google Calendar sync token expired");
    if (!response.ok) throw new Error(`Google Calendar API request failed: ${response.status}`);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}
