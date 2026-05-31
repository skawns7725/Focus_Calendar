import { describe, expect, it, vi } from "vitest";
import { buildGoogleAuthorizationUrl } from "./google-auth";
import { calendarScopes, readOnlyScopes } from "./google-scopes";
import { GoogleCalendarClient, GoogleSyncTokenExpiredError, findDedicatedCalendar } from "./google-calendar-client";

describe("Google Calendar authorization", () => {
  it("requests read-only calendar access by default", () => {
    const url = buildGoogleAuthorizationUrl({
      clientId: "client-id",
      redirectUri: "http://localhost:3000/api/google/callback",
      state: "read-state",
      mode: "read"
    });

    const scopes = new URL(url).searchParams.get("scope")?.split(" ");
    expect(scopes).toContain(readOnlyScopes[0]);
    expect(scopes).not.toContain(calendarScopes.write);
  });

  it("requests incremental write access only for two-way sync", () => {
    const url = buildGoogleAuthorizationUrl({
      clientId: "client-id",
      redirectUri: "http://localhost:3000/api/google/callback",
      state: "write-state",
      mode: "write"
    });

    const scopes = new URL(url).searchParams.get("scope")?.split(" ");
    expect(url).toContain("include_granted_scopes=true");
    expect(scopes).toContain(calendarScopes.write);
  });
});

it("selects only the dedicated Focus Calendar calendar", () => {
  expect(findDedicatedCalendar([
    { id: "primary", summary: "Personal", primary: true },
    { id: "focus", summary: "Focus Calendar" }
  ])).toEqual({ id: "focus", summary: "Focus Calendar" });
});

describe("Google Calendar client", () => {
  it("uses a sync token for incremental event reads", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ items: [], nextSyncToken: "next" }), { status: 200 }));
    const client = new GoogleCalendarClient("access", request);

    await client.listEvents("primary", { syncToken: "cursor" });

    expect(request).toHaveBeenCalledWith(expect.stringContaining("syncToken=cursor"), expect.anything());
  });

  it("reports an expired sync token", async () => {
    const client = new GoogleCalendarClient("access", vi.fn(async () => new Response("", { status: 410 })));
    await expect(client.listEvents("primary", { syncToken: "expired" })).rejects.toBeInstanceOf(GoogleSyncTokenExpiredError);
  });

  it("updates and deletes dedicated calendar task events", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ id: "event-1" }), { status: 200 }));
    const client = new GoogleCalendarClient("access", request);
    const input = {
      summary: "보고서",
      start: { dateTime: "2026-06-01T09:00:00+09:00" },
      end: { dateTime: "2026-06-01T10:00:00+09:00" },
      extendedProperties: { private: { focusCalendarQuestId: "quest-1" } }
    };

    await client.updateTaskEvent("focus", "event-1", input);
    await client.deleteTaskEvent("focus", "event-1");

    expect(request).toHaveBeenNthCalledWith(1, expect.stringContaining("/events/event-1"), expect.objectContaining({ method: "PATCH" }));
    expect(request).toHaveBeenNthCalledWith(2, expect.stringContaining("/events/event-1"), expect.objectContaining({ method: "DELETE" }));
  });
});
