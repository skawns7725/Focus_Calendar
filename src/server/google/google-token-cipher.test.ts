import { describe, expect, it } from "vitest";
import { createGoogleTokenCipher } from "./google-token-cipher";

const key = Buffer.alloc(32, 7).toString("base64");

describe("Google token cipher", () => {
  it("round trips randomized ciphertext", () => {
    const cipher = createGoogleTokenCipher(key, "production");
    const first = cipher.encrypt("secret-token");
    const second = cipher.encrypt("secret-token");
    expect(first).toMatch(/^enc:v1:/);
    expect(second).not.toBe(first);
    expect(cipher.decrypt(first)).toBe("secret-token");
    expect(cipher.decrypt(second)).toBe("secret-token");
  });

  it("reads legacy plaintext only outside production", () => {
    expect(createGoogleTokenCipher(undefined, "development").decrypt("legacy-token")).toBe("legacy-token");
    expect(() => createGoogleTokenCipher(undefined, "production").decrypt("legacy-token")).toThrow("GOOGLE_TOKEN_ENCRYPTION_KEY");
  });

  it("rejects missing production encryption keys", () => {
    expect(() => createGoogleTokenCipher(undefined, "production").encrypt("secret-token")).toThrow("GOOGLE_TOKEN_ENCRYPTION_KEY");
  });
});
