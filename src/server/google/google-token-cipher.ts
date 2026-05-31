import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

export function createGoogleTokenCipher(encodedKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY, environment = process.env.NODE_ENV) {
  const key = encodedKey ? Buffer.from(encodedKey, "base64") : null;
  if (key && key.length !== 32) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must decode to 32 bytes");

  function requireKey() {
    if (key) return key;
    if (environment === "production") throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is required in production");
    return null;
  }

  return {
    encrypt(value: string) {
      const encryptionKey = requireKey();
      if (!encryptionKey) return value;
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
      const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
      return `${PREFIX}${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${ciphertext.toString("base64url")}`;
    },

    decrypt(value: string) {
      if (!value.startsWith(PREFIX)) {
        requireKey();
        return value;
      }
      const encryptionKey = requireKey();
      if (!encryptionKey) throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY is required to decrypt Google tokens");
      const [iv, tag, ciphertext] = value.slice(PREFIX.length).split(":");
      if (!iv || !tag || !ciphertext) throw new Error("Malformed encrypted Google token");
      const decipher = createDecipheriv("aes-256-gcm", encryptionKey, Buffer.from(iv, "base64url"));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
    }
  };
}
