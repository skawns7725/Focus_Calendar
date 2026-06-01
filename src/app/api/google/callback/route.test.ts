import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";
import { exchangeGoogleCode } from "@/server/google/google-auth";

const callbackMocks = vi.hoisted(() => ({
  saveTokens: vi.fn(),
  sync: vi.fn(async () => undefined),
  createSession: vi.fn(async () => "session-token")
}));

vi.mock("@/server/google/google-auth", () => ({
  exchangeGoogleCode: vi.fn(),
  fetchGoogleProfile: vi.fn(async () => ({ sub: "google-user", email: "user@example.com" })),
  getGoogleOAuthStateSecret: vi.fn(() => "secret"),
  refreshGoogleToken: vi.fn()
}));
vi.mock("@/server/google/google-oauth-state", () => ({
  verifyGoogleOAuthState: vi.fn(() => ({ mode: "read" }))
}));
vi.mock("@/server/google", () => ({
  createGoogleServices: vi.fn(() => ({
    googleConnectionRepository: { saveTokens: callbackMocks.saveTokens },
    googleSyncService: { sync: callbackMocks.sync, enableTwoWaySync: vi.fn() }
  }))
}));
vi.mock("@/server/auth/session-repository", () => ({
  SessionRepository: class {
    create = callbackMocks.createSession;
  }
}));
vi.mock("@/server/auth/user-repository", () => ({
  UserRepository: class {
    async upsertGoogleProfile() { return { id: "owner-1" }; }
  }
}));
vi.mock("@/server/auth/cookies", () => ({
  serializeSessionCookie: vi.fn(() => "focus-session=session-token")
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it("returns to settings with a reconnect hint when OAuth completion fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.mocked(exchangeGoogleCode).mockRejectedValue(new Error("token exchange failed"));

  const response = await GET(new Request("https://focus-calendar.example/api/google/callback?code=once&state=valid"));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://focus-calendar.example/settings?google=error");
});

it("starts the first calendar sync before returning from a successful connection", async () => {
  vi.mocked(exchangeGoogleCode).mockResolvedValue({ access_token: "access", expires_in: 3600 });

  const response = await GET(new Request("https://focus-calendar.example/api/google/callback?code=once&state=valid"));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://focus-calendar.example/settings?google=connected");
  expect(callbackMocks.saveTokens).toHaveBeenCalled();
  expect(callbackMocks.sync).toHaveBeenCalled();
});
