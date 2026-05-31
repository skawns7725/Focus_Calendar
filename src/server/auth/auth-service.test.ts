import { describe, expect, it } from "vitest";
import { createAuthService, UnauthorizedError } from "./auth-service";
import { clearSessionCookie, serializeSessionCookie } from "./cookies";

function request(cookie?: string) {
  return new Request("http://localhost/api/settings", { headers: cookie ? { cookie } : undefined });
}

describe("auth service", () => {
  it("resolves a valid session cookie", async () => {
    const auth = createAuthService({ findOwner: async (token) => token === "valid" ? "owner-a" : null }, "production");
    await expect(auth.getActor(request("focus_session=valid"))).resolves.toEqual({ ownerId: "owner-a", localDevelopment: false });
  });

  it("rejects a missing production session", async () => {
    const auth = createAuthService({ findOwner: async () => null }, "production");
    await expect(auth.requireActor(request())).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("uses the local owner without a development session", async () => {
    const auth = createAuthService({ findOwner: async () => null }, "development");
    await expect(auth.requireActor(request())).resolves.toEqual({ ownerId: "local", localDevelopment: true });
  });
});

describe("session cookies", () => {
  it("serializes secure production cookies and explicit clearing", () => {
    expect(serializeSessionCookie("raw token", true)).toContain("focus_session=raw%20token; Path=/; HttpOnly; SameSite=Lax; Secure");
    expect(clearSessionCookie(true)).toContain("Max-Age=0");
  });
});
