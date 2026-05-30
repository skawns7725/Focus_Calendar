import { describe, expect, it } from "vitest";
import { buildGoogleAuthorizationUrl } from "./google-auth";
import { calendarScopes, readOnlyScopes } from "./google-scopes";
import { findDedicatedCalendar } from "./google-calendar-client";

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
