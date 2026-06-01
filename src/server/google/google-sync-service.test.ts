import { beforeEach, describe, expect, it } from "vitest";
import { Quest } from "@/domain/types";
import { GoogleCalendarGateway, GoogleCalendarSummary, GoogleEventInput, GoogleEventPage, GoogleSyncTokenExpiredError } from "./google-calendar-client";
import { GoogleSyncRepository, SyncConnectionRepository, createGoogleSyncService } from "./google-sync-service";

const scheduledQuest: Quest = {
  id: "quest-1",
  title: "보고서",
  note: "검토할 자료 링크",
  location: "회의실 A",
  kind: "fixed",
  deadline: "2026-06-02T18:00:00+09:00",
  expectedMinutes: 60,
  plannedStart: "2026-06-01T09:00:00+09:00",
  importance: 2,
  carryoverCount: 0,
  status: "scheduled"
};

class FakeGateway implements GoogleCalendarGateway {
  calendars: GoogleCalendarSummary[] = [{ id: "primary", summary: "기본" }, { id: "work", summary: "업무" }];
  pages = new Map<string, GoogleEventPage>();
  nextPages = new Map<string, GoogleEventPage>();
  expireOnce = new Set<string>();
  created: Array<{ calendarId: string; input: GoogleEventInput }> = [];
  deleted: string[] = [];

  async ensureDedicatedCalendar() { return { id: "focus", summary: "Focus Calendar" }; }
  async listCalendars() { return this.calendars; }
  async listEvents(calendarId: string, options?: { syncToken?: string; pageToken?: string }) {
    if (options?.syncToken && this.expireOnce.delete(calendarId)) throw new GoogleSyncTokenExpiredError();
    if (options?.pageToken) return this.nextPages.get(options.pageToken) ?? { items: [] };
    return this.pages.get(calendarId) ?? { items: [], nextSyncToken: `${calendarId}-next` };
  }
  async createTaskEvent(calendarId: string, input: GoogleEventInput) {
    this.created.push({ calendarId, input });
    return { id: "google-quest-1" };
  }
  async updateTaskEvent() { return { id: "google-quest-1" }; }
  async deleteTaskEvent(_calendarId: string, eventId: string) { this.deleted.push(eventId); }
}

class FakeRepository implements GoogleSyncRepository {
  settings = { twoWaySync: false, googleImportMode: "selected" as const, selectedGoogleCalendarIds: ["work"] };
  cursors = new Map<string, string>();
  blocks = new Map<string, { externalId: string; calendarId: string; googleEventId: string; title: string; start: string; end: string }>();
  mappings = new Map<string, { questId: string; calendarId: string; googleEventId: string }>();
  quests = new Map<string, Quest>();

  async getSettings() { return this.settings; }
  async enableTwoWaySync() { this.settings = { ...this.settings, twoWaySync: true }; }
  async getCursor(calendarId: string) { return this.cursors.get(calendarId) ?? null; }
  async setCursor(calendarId: string, syncToken: string | null) { if (syncToken) this.cursors.set(calendarId, syncToken); else this.cursors.delete(calendarId); }
  async upsertBlock(block: { externalId: string; calendarId: string; googleEventId: string; title: string; start: string; end: string }) { this.blocks.set(block.externalId, block); }
  async deleteBlock(calendarId: string, googleEventId: string) { this.blocks.delete(`${calendarId}:${googleEventId}`); }
  async listQuests() { return [...this.quests.values()]; }
  async listMappings() { return [...this.mappings.values()]; }
  async saveMapping(mapping: { questId: string; calendarId: string; googleEventId: string }) { this.mappings.set(mapping.questId, mapping); }
  async deleteMapping(questId: string) { this.mappings.delete(questId); }
  async updateQuest(id: string, changes: Partial<Quest>) { this.quests.set(id, { ...this.quests.get(id)!, ...changes }); }
  async deleteQuest(id: string) { this.quests.delete(id); }
}

describe("Google sync service", () => {
  let gateway: FakeGateway;
  let repository: FakeRepository;
  let connection: SyncConnectionRepository;

  beforeEach(() => {
    gateway = new FakeGateway();
    repository = new FakeRepository();
    connection = {
      get: async () => ({ accessToken: "access", refreshToken: null, tokenExpiresAt: new Date("2099-01-01"), dedicatedCalendarId: null }),
      saveTokens: async () => undefined,
      setDedicatedCalendar: async () => undefined,
      recordSyncSuccess: async () => undefined,
      recordSyncError: async () => undefined,
      status: async () => ({})
    };
  });

  it("imports selected calendar events and removes cancelled events incrementally", async () => {
    gateway.pages.set("work", { items: [{ id: "meeting", summary: "회의", start: { dateTime: "2026-06-01T10:00:00+09:00" }, end: { dateTime: "2026-06-01T11:00:00+09:00" } }], nextSyncToken: "cursor-1" });
    const service = createGoogleSyncService(connection, repository, () => gateway);
    await service.sync();
    expect(repository.blocks.get("work:meeting")?.title).toBe("회의");
    expect(repository.cursors.get("work")).toBe("cursor-1");

    gateway.pages.set("work", { items: [{ id: "meeting", status: "cancelled" }], nextSyncToken: "cursor-2" });
    await service.sync();
    expect(repository.blocks.has("work:meeting")).toBe(false);
  });

  it("imports every result page and recovers from an expired cursor", async () => {
    repository.cursors.set("work", "expired");
    gateway.expireOnce.add("work");
    gateway.pages.set("work", {
      items: [{ id: "first", summary: "첫 일정", start: { dateTime: "2026-06-01T10:00:00+09:00" }, end: { dateTime: "2026-06-01T11:00:00+09:00" } }],
      nextPageToken: "page-2"
    });
    gateway.nextPages.set("page-2", {
      items: [{ id: "second", summary: "둘째 일정", start: { dateTime: "2026-06-01T12:00:00+09:00" }, end: { dateTime: "2026-06-01T13:00:00+09:00" } }],
      nextSyncToken: "recovered"
    });

    await createGoogleSyncService(connection, repository, () => gateway).sync();

    expect(repository.blocks.has("work:first")).toBe(true);
    expect(repository.blocks.has("work:second")).toBe(true);
    expect(repository.cursors.get("work")).toBe("recovered");
  });

  it("creates dedicated events and deletes tasks removed from Google Calendar", async () => {
    repository.settings = { ...repository.settings, twoWaySync: true };
    repository.quests.set(scheduledQuest.id, scheduledQuest);
    const service = createGoogleSyncService(connection, repository, () => gateway);

    await service.sync();
    expect(gateway.created).toHaveLength(1);
    expect(gateway.created[0]?.input.description).toBe("검토할 자료 링크");
    expect(gateway.created[0]?.input.location).toBe("회의실 A");
    expect(repository.mappings.get("quest-1")?.googleEventId).toBe("google-quest-1");

    gateway.pages.set("focus", { items: [{ id: "google-quest-1", status: "cancelled" }], nextSyncToken: "focus-2" });
    await service.sync();
    expect(repository.quests.has("quest-1")).toBe(false);
  });

  it("refreshes an expired access token before Calendar API calls", async () => {
    let token = "expired-access";
    connection = {
      ...connection,
      get: async () => ({ accessToken: token, refreshToken: "refresh", tokenExpiresAt: token === "expired-access" ? new Date("2000-01-01") : new Date("2099-01-01"), dedicatedCalendarId: null }),
      saveTokens: async (input) => { token = input.accessToken; }
    };
    let gatewayToken = "";

    await createGoogleSyncService(connection, repository, (accessToken) => {
      gatewayToken = accessToken;
      return gateway;
    }, async () => ({ access_token: "fresh-access", expires_in: 3600 })).sync();

    expect(gatewayToken).toBe("fresh-access");
  });

  it("reconciles Google-side task deletion from a later dedicated-calendar page", async () => {
    repository.settings = { ...repository.settings, twoWaySync: true };
    repository.quests.set(scheduledQuest.id, scheduledQuest);
    repository.mappings.set("quest-1", { questId: "quest-1", calendarId: "focus", googleEventId: "google-quest-1" });
    gateway.pages.set("focus", { items: [], nextPageToken: "focus-page-2" });
    gateway.nextPages.set("focus-page-2", { items: [{ id: "google-quest-1", status: "cancelled" }], nextSyncToken: "focus-next" });

    await createGoogleSyncService(connection, repository, () => gateway).sync();

    expect(repository.quests.has("quest-1")).toBe(false);
  });
});
