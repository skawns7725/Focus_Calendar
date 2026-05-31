import { createHmac, timingSafeEqual } from "node:crypto";

export type GoogleOAuthMode = "read" | "write";

interface GoogleOAuthState {
  mode: GoogleOAuthMode;
  expiresAt: number;
  ownerId?: string;
}

export function createGoogleOAuthState(mode: GoogleOAuthMode, secret: string, now = Date.now(), ownerId?: string): string {
  const payload = Buffer.from(JSON.stringify({ mode, expiresAt: now + 5 * 60 * 1000, ...(ownerId ? { ownerId } : {}) })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyGoogleOAuthState(state: string, secret: string, now = Date.now()): GoogleOAuthState {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) throw new Error("Invalid Google OAuth state");
  const expected = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Invalid Google OAuth state");
  }
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as GoogleOAuthState;
  if (!["read", "write"].includes(parsed.mode) || parsed.expiresAt < now) throw new Error("Invalid Google OAuth state");
  return parsed;
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
