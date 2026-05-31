import { db } from "../db";
import { createGoogleTokenCipher } from "./google-token-cipher";

export class GoogleConnectionRepository {
  private readonly tokenCipher;

  constructor(
    private readonly ownerId = "local",
    encodedEncryptionKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY,
    environment = process.env.NODE_ENV
  ) {
    this.tokenCipher = createGoogleTokenCipher(encodedEncryptionKey, environment);
  }

  async get() {
    const connection = await db.googleConnection.findUnique({ where: { ownerId: this.ownerId } });
    return connection ? {
      ...connection,
      accessToken: connection.accessToken ? this.tokenCipher.decrypt(connection.accessToken) : null,
      refreshToken: connection.refreshToken ? this.tokenCipher.decrypt(connection.refreshToken) : null
    } : null;
  }

  async saveTokens(input: { accessToken: string; refreshToken?: string; expiresIn: number; scope?: string }) {
    const existing = await this.get();
    const data = {
      accessToken: this.tokenCipher.encrypt(input.accessToken),
      refreshToken: input.refreshToken
        ? this.tokenCipher.encrypt(input.refreshToken)
        : existing?.refreshToken
          ? this.tokenCipher.encrypt(existing.refreshToken)
          : undefined,
      tokenExpiresAt: new Date(Date.now() + input.expiresIn * 1000),
      scope: input.scope,
      lastSyncError: null
    };
    return db.googleConnection.upsert({ where: { ownerId: this.ownerId }, create: { ownerId: this.ownerId, ...data }, update: data });
  }

  async recordSyncSuccess() {
    const data = { lastSyncedAt: new Date(), lastSyncError: null };
    return db.googleConnection.upsert({ where: { ownerId: this.ownerId }, create: { ownerId: this.ownerId, ...data }, update: data });
  }

  async recordSyncError(error: string) {
    const data = { lastSyncError: error };
    return db.googleConnection.upsert({ where: { ownerId: this.ownerId }, create: { ownerId: this.ownerId, ...data }, update: data });
  }

  setDedicatedCalendar(id: string) {
    return db.googleConnection.upsert({ where: { ownerId: this.ownerId }, create: { ownerId: this.ownerId, dedicatedCalendarId: id }, update: { dedicatedCalendarId: id } });
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
