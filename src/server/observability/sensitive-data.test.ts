import { describe, expect, it } from "vitest";
import { sanitizeErrorContext, sanitizeSentryEvent } from "./sensitive-data";

describe("observability sensitive data filters", () => {
  it("redacts tokens, authorization headers, database URLs, and calendar details from Sentry events", () => {
    const event = sanitizeSentryEvent({
      request: {
        url: "https://focus-calendar.example/api?DATABASE_URL=postgresql://secret",
        headers: {
          Authorization: "Bearer secret-token",
          Cookie: "focus_session=secret-cookie",
          "Set-Cookie": "focus_session=secret-cookie"
        }
      },
      extra: {
        title: "Private event title",
        note: "Private note",
        description: "Private description",
        location: "Private location",
        token: "secret-token",
        clientSecret: "google-client-secret",
        safeCount: 3,
        message: "Failed for user@example.com with Bearer another-secret and code=oauth-code"
      },
      contexts: {
        calendar: {
          googleEventTitle: "Dentist appointment",
          durationBucket: "short"
        }
      }
    });

    expect(JSON.stringify(event)).not.toContain("secret-token");
    expect(JSON.stringify(event)).not.toContain("secret-cookie");
    expect(JSON.stringify(event)).not.toContain("google-client-secret");
    expect(JSON.stringify(event)).not.toContain("user@example.com");
    expect(JSON.stringify(event)).not.toContain("another-secret");
    expect(JSON.stringify(event)).not.toContain("oauth-code");
    expect(JSON.stringify(event)).not.toContain("postgresql://secret");
    expect(JSON.stringify(event)).not.toContain("Private event title");
    expect(JSON.stringify(event)).not.toContain("Dentist appointment");
    expect(event.extra?.safeCount).toBe(3);
    expect(event.contexts?.calendar.durationBucket).toBe("short");
  });

  it("keeps only non-sensitive diagnostic context", () => {
    expect(sanitizeErrorContext({
      source: "google_sync",
      ownerId: "owner-1",
      title: "Private calendar event",
      category: "study",
      expectedMinutes: 50
    })).toEqual({
      source: "google_sync",
      ownerId: "owner-1",
      category: "study",
      expectedMinutes: 50
    });
  });
});
