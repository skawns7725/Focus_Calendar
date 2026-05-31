import { db } from "../db";

export class GoogleConnectionRepository {
  get() {
    return db.googleConnection.findUnique({ where: { id: "local" } });
  }

  async saveTokens(input: { accessToken: string; refreshToken?: string; expiresIn: number; scope?: string }) {
    const existing = await this.get();
    const data = {
      accessToken: input.accessToken,
      refreshToken: input.refreshToken ?? existing?.refreshToken,
      tokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
      scope: input.scope,
      lastSyncError: null
    };
    return db.googleConnection.upsert({ where: { id: "local" }, create: { id: "local", ...data }, update: data });
  }

  async recordSyncSuccess() {
    return db.googleConnection.update({ where: { id: "local" }, data: { lastSyncedAt: new Date(), lastSyncError: null } });
  }

  async recordSyncError(error: string) {
    return db.googleConnection.update({ where: { id: "local" }, data: { lastSyncError: error } });
  }

  setDedicatedCalendar(id: string) {
    return db.googleConnection.upsert({ where: { id: "local" }, create: { id: "local", dedicatedCalendarId: id }, update: { dedicatedCalendarId: id } });
  }

  async status() {
    const connection = await this.get();
    return {
      configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      connected: Boolean(connection?.accessToken),
      dedicatedCalendarId: connection?.dedicatedCalendarId ?? null,
      lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
      lastSyncError: connection?.lastSyncError ?? null
    };
  }
}
