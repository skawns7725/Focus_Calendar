import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const loginMocks = vi.hoisted(() => ({
  createSession: vi.fn(async () => "session-token"),
  upsertPreviewTestUser: vi.fn(async () => ({ id: "preview-smoke-owner" }))
}));

const observabilityMocks = vi.hoisted(() => ({
  captureServerError: vi.fn(),
  captureProductEvent: vi.fn()
}));

vi.mock("@/server/auth/session-repository", () => ({
  SessionRepository: class {
    create = loginMocks.createSession;
  }
}));

vi.mock("@/server/auth/user-repository", () => ({
  UserRepository: class {
    upsertPreviewTestUser = loginMocks.upsertPreviewTestUser;
  }
}));

vi.mock("@/server/auth/cookies", () => ({
  serializeSessionCookie: vi.fn(() => "focus_session=session-token; Path=/; HttpOnly; SameSite=Lax; Secure")
}));
vi.mock("@/server/observability/sentry", () => ({
  captureServerError: observabilityMocks.captureServerError
}));
vi.mock("@/client/analytics", () => ({
  captureProductEvent: observabilityMocks.captureProductEvent
}));

describe("preview test login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("is unavailable in production", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("PREVIEW_TEST_LOGIN_ENABLED", "true");
    vi.stubEnv("PREVIEW_TEST_LOGIN_SECRET", "correct-secret");

    const response = await POST(request("correct-secret"));

    expect(response.status).toBe(404);
    expect(loginMocks.createSession).not.toHaveBeenCalled();
  });

  it("is unavailable when disabled", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PREVIEW_TEST_LOGIN_ENABLED", "false");
    vi.stubEnv("PREVIEW_TEST_LOGIN_SECRET", "correct-secret");

    const response = await POST(request("correct-secret"));

    expect(response.status).toBe(401);
    expect(loginMocks.createSession).not.toHaveBeenCalled();
  });

  it("is unavailable when the secret is missing", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PREVIEW_TEST_LOGIN_ENABLED", "true");

    const response = await POST(request("correct-secret"));

    expect(response.status).toBe(401);
    expect(loginMocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects the wrong secret", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PREVIEW_TEST_LOGIN_ENABLED", "true");
    vi.stubEnv("PREVIEW_TEST_LOGIN_SECRET", "correct-secret");

    const response = await POST(request("wrong-secret"));

    expect(response.status).toBe(401);
    expect(loginMocks.createSession).not.toHaveBeenCalled();
  });

  it("creates a preview test session without returning the secret", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PREVIEW_TEST_LOGIN_ENABLED", "true");
    vi.stubEnv("PREVIEW_TEST_LOGIN_SECRET", "correct-secret");

    const response = await POST(request("correct-secret"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("focus_session=");
    expect(body).toEqual({ ok: true, ownerKind: "preview-test", createdFor: "preview-core-smoke" });
    expect(JSON.stringify(body)).not.toContain("correct-secret");
    expect(observabilityMocks.captureServerError).not.toHaveBeenCalled();
    expect(observabilityMocks.captureProductEvent).not.toHaveBeenCalled();
    expect(loginMocks.upsertPreviewTestUser).toHaveBeenCalledWith(expect.objectContaining({
      id: expect.stringMatching(/^preview-smoke-/),
      email: expect.stringContaining("@focus-calendar.preview.test")
    }));
    expect(loginMocks.upsertPreviewTestUser.mock.calls[0]?.[0]).not.toHaveProperty("createdFor");
    expect(loginMocks.upsertPreviewTestUser.mock.calls[0]?.[0]).not.toHaveProperty("createdAt");
    expect(loginMocks.createSession).toHaveBeenCalledWith("preview-smoke-owner");
  });

  it("accepts the x-preview-test-secret header without exposing it", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PREVIEW_TEST_LOGIN_ENABLED", "true");
    vi.stubEnv("PREVIEW_TEST_LOGIN_SECRET", "correct-secret");

    const response = await POST(new Request("https://focus-calendar.example/api/test/login", {
      method: "POST",
      headers: { "x-preview-test-secret": "correct-secret" }
    }));

    expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).not.toContain("correct-secret");
  });
});

function request(secret: string) {
  return new Request("https://focus-calendar.example/api/test/login", {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` }
  });
}
