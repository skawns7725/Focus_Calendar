import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";
import { exchangeGoogleCode } from "@/server/google/google-auth";

vi.mock("@/server/google/google-auth", () => ({
  exchangeGoogleCode: vi.fn(),
  fetchGoogleProfile: vi.fn(),
  getGoogleOAuthStateSecret: vi.fn(() => "secret"),
  refreshGoogleToken: vi.fn()
}));
vi.mock("@/server/google/google-oauth-state", () => ({
  verifyGoogleOAuthState: vi.fn(() => ({ mode: "read" }))
}));

beforeEach(() => vi.clearAllMocks());

it("returns to settings with a reconnect hint when OAuth completion fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.mocked(exchangeGoogleCode).mockRejectedValue(new Error("token exchange failed"));

  const response = await GET(new Request("https://focus-calendar.example/api/google/callback?code=once&state=valid"));

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("https://focus-calendar.example/settings?google=error");
});
