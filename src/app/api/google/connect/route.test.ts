import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";

const googleAuthMocks = vi.hoisted(() => ({
  buildGoogleAuthorizationUrl: vi.fn(() => "https://accounts.google.example/oauth"),
  requireEnv: vi.fn(() => "configured"),
  getGoogleRedirectUri: vi.fn(() => "https://focus-calendar.example/api/google/callback"),
  getGoogleOAuthStateSecret: vi.fn(() => "state-secret")
}));

vi.mock("@/server/google/google-auth", () => googleAuthMocks);
vi.mock("@/server/google/google-oauth-state", () => ({
  createGoogleOAuthState: vi.fn(() => "state")
}));
vi.mock("@/server/auth/auth-service", () => ({
  authService: {
    getActor: vi.fn(async () => ({ ownerId: "owner-1", localDevelopment: false }))
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

it("blocks Google Calendar write authorization unless the write feature flag is enabled", async () => {
  vi.stubEnv("GOOGLE_CALENDAR_WRITE_ENABLED", "false");

  const response = await GET(new Request("https://focus-calendar.example/api/google/connect?mode=write"));

  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "Google Calendar write sync is disabled" });
  expect(googleAuthMocks.buildGoogleAuthorizationUrl).not.toHaveBeenCalled();
});
