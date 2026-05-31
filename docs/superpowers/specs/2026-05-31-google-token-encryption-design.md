# Google Token Encryption Design

## Goal

Encrypt Google OAuth access and refresh tokens at rest without breaking existing local development records.

## Design

- Use AES-256-GCM with a random 12-byte IV for every encrypted value.
- Read a base64-encoded 32-byte key from `GOOGLE_TOKEN_ENCRYPTION_KEY`.
- Store encrypted values as `enc:v1:<iv>:<tag>:<ciphertext>`.
- Decrypt only inside the Google connection repository before tokens reach sync services.
- Encrypt new OAuth tokens and refreshed access tokens before database writes.
- Treat existing values without the `enc:v1:` prefix as legacy plaintext so the next save or refresh migrates them naturally.
- Require the encryption key in production. Allow plaintext fallback only in local development so setup remains lightweight.

## Failure Handling

- Reject malformed encrypted payloads.
- Reject production startup paths that attempt to store or read tokens without a configured encryption key.
- Never log raw tokens or encryption keys.

## Testing

- Verify encryption round trips and uses different ciphertext for the same input.
- Verify legacy plaintext compatibility in development.
- Verify production rejects a missing key.
- Verify Google connection repository stores ciphertext and returns plaintext to callers.
