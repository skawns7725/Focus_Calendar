import { describe, expect, it, vi } from "vitest";
import { buildGoogleAuthorizationUrl, fetchGoogleProfile, refreshGoogleToken } from "./google-auth";

describe("Google token refresh", () => {
  it("exchanges a refresh token for a new access token", async () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    const request = vi.fn(async () => new Response(JSON.stringify({
      access_token: "new-access",
      expires_in: 3600,
      scope: "calendar"
    }), { status: 200 }));

    const token = await refreshGoogleToken("refresh-token", request);

    expect(token.access_token).toBe("new-access");
    expect(request).toHaveBeenCalledWith("https://oauth2.googleapis.com/token", expect.objectContaining({
      method: "POST",
      body: expect.any(URLSearchParams)
    }));
    const body = request.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("refresh-token");
  });
});

describe("Google identity", () => {
  it("requests identity scopes with calendar access", () => {
    const url = new URL(buildGoogleAuthorizationUrl({ clientId: "client", redirectUri: "http://localhost/callback", state: "state", mode: "read" }));
    expect(url.searchParams.get("scope")).toContain("openid");
    expect(url.searchParams.get("scope")).toContain("email");
  });

  it("fetches the signed-in Google profile", async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ sub: "google-id", email: "user@example.com" }), { status: 200 }));
    await expect(fetchGoogleProfile("access", request)).resolves.toEqual({ sub: "google-id", email: "user@example.com" });
    expect(request).toHaveBeenCalledWith("https://openidconnect.googleapis.com/v1/userinfo", { headers: { authorization: "Bearer access" } });
  });
});
