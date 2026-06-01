import { Quest } from "@/domain/types";
import { refreshGoogleToken } from "./google-auth";
import { GoogleCalendarClient, GoogleCalendarEvent, GoogleCalendarGateway, GoogleEventInput, GoogleSyncTokenExpiredError } from "./google-calendar-client";

interface Connection {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  dedicatedCalendarId: string | null;
}

export interface SyncConnectionRepository {
  get(): Promise<Connection | null>;
  saveTokens(input: { accessToken: string; refreshToken?: string; expiresIn: number; scope?: string }): Promise<unknown>;
  setDedicatedCalendar(id: string): Promise<unknown>;
  recordSyncSuccess(): Promise<unknown>;
  recordSyncError(error: string): Promise<unknown>;
  status(): Promise<unknown>;
}

export interface GoogleSyncRepository {
  getSettings(): Promise<{ twoWaySync: boolean; googleImportMode: "all" | "selected" | null; selectedGoogleCalendarIds: string[] }>;
  getCursor(calendarId: string): Promise<string | null>;
  setCursor(calendarId: string, syncToken: string | null): Promise<unknown>;
  upsertBlock(block: { externalId: string; calendarId: string; googleEventId: string; title: string; start: string; end: string }): Promise<unknown>;
  deleteBlock(calendarId: string, googleEventId: string): Promise<unknown>;
  listQuests(): Promise<Quest[]>;
  listMappings(): Promise<Array<{ questId: string; calendarId: string; googleEventId: string }>>;
  saveMapping(mapping: { questId: string; calendarId: string; googleEventId: string }): Promise<unknown>;
  deleteMapping(questId: string): Promise<unknown>;
  updateQuest(id: string, changes: Partial<Quest>): Promise<unknown>;
  deleteQuest(id: string): Promise<unknown>;
  enableTwoWaySync(): Promise<unknown>;
}

type GatewayFactory = (accessToken: string) => GoogleCalendarGateway;
type TokenRefresh = (refreshToken: string) => Promise<{ access_token: string; refresh_token?: string; expires_in: number; scope?: string }>;

export function createGoogleSyncService(
  connections: SyncConnectionRepository,
  repository?: GoogleSyncRepository,
  gatewayFactory: GatewayFactory = (accessToken) => new GoogleCalendarClient(accessToken),
  tokenRefresh: TokenRefresh = refreshGoogleToken
) {
  return {
    status: () => connections.status(),
    async enableTwoWaySync() {
      const gateway = await getGateway(connections, gatewayFactory, tokenRefresh);
      const calendar = await gateway.ensureDedicatedCalendar();
      await connections.setDedicatedCalendar(calendar.id);
      await repository?.enableTwoWaySync();
      return calendar;
    },
    async listCalendars() {
      return (await getGateway(connections, gatewayFactory, tokenRefresh)).listCalendars();
    },
    async sync() {
      if (!repository) throw new Error("Google sync repository is required");
      try {
        const connection = await connections.get();
        if (!connection?.accessToken) throw new Error("Google Calendar connection is required");
        const gateway = await getGateway(connections, gatewayFactory, tokenRefresh);
        const settings = await repository.getSettings();
        let dedicatedCalendarId = connection.dedicatedCalendarId;

        if (settings.twoWaySync) {
          dedicatedCalendarId ??= (await gateway.ensureDedicatedCalendar()).id;
          if (dedicatedCalendarId !== connection.dedicatedCalendarId) await connections.setDedicatedCalendar(dedicatedCalendarId);
          await reconcileDedicatedCalendar(repository, gateway, dedicatedCalendarId);
        }

        const calendars = await gateway.listCalendars();
        const selected = settings.googleImportMode === "all"
          ? calendars
          : calendars.filter((calendar) => settings.selectedGoogleCalendarIds.includes(calendar.id));
        for (const calendar of selected.filter((calendar) => calendar.id !== dedicatedCalendarId)) {
          await importCalendar(repository, gateway, calendar.id);
        }

        if (settings.twoWaySync && dedicatedCalendarId) {
          await pushTasks(repository, gateway, dedicatedCalendarId);
        }
        await connections.recordSyncSuccess();
        return { importedCalendars: selected.length };
      } catch (error) {
        await connections.recordSyncError(error instanceof Error ? error.message : "Google Calendar sync failed");
        throw error;
      }
    }
  };
}

async function getGateway(connections: SyncConnectionRepository, gatewayFactory: GatewayFactory, tokenRefresh: TokenRefresh) {
  let connection = await connections.get();
  if (!connection?.accessToken) throw new Error("Google Calendar connection is required");
  if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() <= Date.now()) {
    if (!connection.refreshToken) throw new Error("Google Calendar reconnection is required");
    const token = await tokenRefresh(connection.refreshToken);
    await connections.saveTokens({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      scope: token.scope
    });
    connection = await connections.get();
  }
  if (!connection?.accessToken) throw new Error("Google Calendar connection is required");
  return gatewayFactory(connection.accessToken);
}

async function importCalendar(repository: GoogleSyncRepository, gateway: GoogleCalendarGateway, calendarId: string) {
  const cursor = await repository.getCursor(calendarId);
  try {
    await applyEventPages(repository, gateway, calendarId, cursor ? { syncToken: cursor } : fullSyncRange());
  } catch (error) {
    if (!(error instanceof GoogleSyncTokenExpiredError)) throw error;
    await repository.setCursor(calendarId, null);
    await applyEventPages(repository, gateway, calendarId, fullSyncRange());
  }
}

async function applyEventPages(repository: GoogleSyncRepository, gateway: GoogleCalendarGateway, calendarId: string, options: { syncToken?: string; timeMin?: string; timeMax?: string }) {
  let pageToken: string | undefined;
  do {
    const page = await gateway.listEvents(calendarId, { ...options, pageToken });
    for (const event of page.items ?? []) {
      if (event.status === "cancelled") {
        await repository.deleteBlock(calendarId, event.id);
      } else if (event.start?.dateTime && event.end?.dateTime) {
        await repository.upsertBlock({
          externalId: `${calendarId}:${event.id}`,
          calendarId,
          googleEventId: event.id,
          title: event.summary ?? "(제목 없음)",
          start: event.start.dateTime,
          end: event.end.dateTime
        });
      }
    }
    pageToken = page.nextPageToken;
    if (!pageToken) await repository.setCursor(calendarId, page.nextSyncToken ?? null);
  } while (pageToken);
}

async function reconcileDedicatedCalendar(repository: GoogleSyncRepository, gateway: GoogleCalendarGateway, calendarId: string) {
  const mappings = await repository.listMappings();
  const byGoogleId = new Map(mappings.map((mapping) => [mapping.googleEventId, mapping]));
  const quests = new Map((await repository.listQuests()).map((quest) => [quest.id, quest]));
  const cursor = await repository.getCursor(calendarId);
  try {
    await applyDedicatedPages(repository, gateway, calendarId, byGoogleId, quests, cursor ? { syncToken: cursor } : fullSyncRange());
  } catch (error) {
    if (!(error instanceof GoogleSyncTokenExpiredError)) throw error;
    await repository.setCursor(calendarId, null);
    await applyDedicatedPages(repository, gateway, calendarId, byGoogleId, quests, fullSyncRange());
  }
}

async function applyDedicatedPages(
  repository: GoogleSyncRepository,
  gateway: GoogleCalendarGateway,
  calendarId: string,
  byGoogleId: Map<string, { questId: string; calendarId: string; googleEventId: string }>,
  quests: Map<string, Quest>,
  options: { syncToken?: string; timeMin?: string; timeMax?: string }
) {
  let pageToken: string | undefined;
  do {
    const page = await gateway.listEvents(calendarId, { ...options, pageToken });
    for (const event of page.items ?? []) {
      const mapping = byGoogleId.get(event.id);
      if (!mapping) {
        if (event.status !== "cancelled" && event.start?.dateTime && event.end?.dateTime) {
          await repository.upsertBlock({
            externalId: `${calendarId}:${event.id}`,
            calendarId,
            googleEventId: event.id,
            title: event.summary ?? "(제목 없음)",
            start: event.start.dateTime,
            end: event.end.dateTime
          });
        }
        continue;
      }
      if (event.status === "cancelled") {
        await repository.deleteQuest(mapping.questId);
        await repository.deleteMapping(mapping.questId);
        continue;
      }
      const quest = quests.get(mapping.questId);
      if (quest && event.start?.dateTime && event.end?.dateTime) {
        await repository.updateQuest(quest.id, {
          title: event.summary ?? quest.title,
          plannedStart: event.start.dateTime,
          expectedMinutes: Math.max(1, Math.round((new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / 60000))
        });
      }
    }
    pageToken = page.nextPageToken;
    if (!pageToken) await repository.setCursor(calendarId, page.nextSyncToken ?? null);
  } while (pageToken);
}

async function pushTasks(repository: GoogleSyncRepository, gateway: GoogleCalendarGateway, calendarId: string) {
  const mappings = new Map((await repository.listMappings()).map((mapping) => [mapping.questId, mapping]));
  for (const quest of await repository.listQuests()) {
    const mapping = mappings.get(quest.id);
    if (quest.status === "completed" || quest.status === "abandoned") {
      if (mapping) {
        await gateway.deleteTaskEvent(mapping.calendarId, mapping.googleEventId);
        await repository.deleteMapping(quest.id);
      }
      continue;
    }
    if (!quest.plannedStart) continue;
    const input = toGoogleEvent(quest);
    if (mapping) {
      await gateway.updateTaskEvent(mapping.calendarId, mapping.googleEventId, input);
    } else {
      const event = await gateway.createTaskEvent(calendarId, input);
      await repository.saveMapping({ questId: quest.id, calendarId, googleEventId: event.id });
    }
  }
}

function toGoogleEvent(quest: Quest): GoogleEventInput {
  const start = new Date(quest.plannedStart!);
  return {
    summary: quest.title,
    description: quest.note || undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: new Date(start.getTime() + quest.expectedMinutes * 60000).toISOString() },
    extendedProperties: { private: { focusCalendarQuestId: quest.id } }
  };
}

function fullSyncRange() {
  const now = Date.now();
  return { timeMin: new Date(now - 30 * 86400000).toISOString(), timeMax: new Date(now + 180 * 86400000).toISOString() };
}
