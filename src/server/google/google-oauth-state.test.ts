import { describe, expect, it } from "vitest";
import { createGoogleOAuthState, verifyGoogleOAuthState } from "./google-oauth-state";

describe("Google OAuth state", () => {
  it("round trips an unexpired signed mode", () => {
    const state = createGoogleOAuthState("write", "secret", 1_000, "owner-a");
    expect(verifyGoogleOAuthState(state, "secret", 1_001)).toEqual({ mode: "write", expiresAt: 301_000, ownerId: "owner-a" });
  });

  it("rejects a modified oauth state", () => {
    const state = createGoogleOAuthState("read", "secret", 1_000);
    expect(() => verifyGoogleOAuthState(`${state}x`, "secret", 1_001)).toThrow("Invalid Google OAuth state");
  });
});
