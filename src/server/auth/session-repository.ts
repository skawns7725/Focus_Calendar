import { createHash, randomBytes } from "node:crypto";
import { db } from "../db";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export class SessionRepository {
  async create(ownerId: string, expiresAt = new Date(Date.now() + SESSION_DURATION_MS)) {
    const token = randomBytes(32).toString("base64url");
    await db.session.create({ data: { ownerId, tokenHash: hashToken(token), expiresAt } });
    return token;
  }

  async findOwner(token: string, now = new Date()) {
    const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) } });
    return session && session.expiresAt > now ? session.ownerId : null;
  }

  delete(token: string) {
    return db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
