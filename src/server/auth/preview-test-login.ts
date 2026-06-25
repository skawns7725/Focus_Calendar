import { randomUUID, timingSafeEqual } from "node:crypto";

export const PREVIEW_TEST_OWNER_PREFIX = "preview-smoke";

export function isPreviewTestLoginEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.VERCEL_ENV === "preview"
    && env.PREVIEW_TEST_LOGIN_ENABLED === "true"
    && Boolean(env.PREVIEW_TEST_LOGIN_SECRET);
}

export function readPreviewTestLoginSecret(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice("Bearer ".length).trim();
  return request.headers.get("x-preview-test-secret")?.trim() ?? "";
}

export function isPreviewTestLoginSecretValid(received: string, expected: string | undefined) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function createPreviewTestUserIdentity(now = new Date()) {
  const id = `${PREVIEW_TEST_OWNER_PREFIX}-${randomUUID()}`;
  return {
    id,
    googleSubject: id,
    email: `${id}@focus-calendar.preview.test`,
    createdFor: "preview-core-smoke",
    createdAt: now.toISOString()
  };
}
