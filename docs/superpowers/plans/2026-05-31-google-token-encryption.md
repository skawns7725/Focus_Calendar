# Google Token Encryption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Encrypt Google OAuth tokens at rest with AES-256-GCM while reading legacy local plaintext records.

**Architecture:** A focused token cipher module owns encryption format and environment-key policy. `GoogleConnectionRepository` encrypts before database writes and decrypts when returning connections to sync services.

**Tech Stack:** TypeScript, Node `crypto`, Vitest, Prisma SQLite

---

### Task 1: Add Token Cipher

**Files:** Create `src/server/google/google-token-cipher.ts`, `src/server/google/google-token-cipher.test.ts`

- [ ] Write RED tests for randomized round trips, legacy local plaintext, and missing production keys.
- [ ] Implement AES-256-GCM `enc:v1` encryption and decryption.
- [ ] Run `npm test -- src/server/google/google-token-cipher.test.ts`.

### Task 2: Encrypt Repository Storage

**Files:** Modify `src/server/google/google-connection-repository.ts`, `src/server/google/google-repositories.test.ts`

- [ ] Add a RED repository test proving DB ciphertext and caller plaintext.
- [ ] Encrypt token writes and decrypt repository reads.
- [ ] Run `npm test -- src/server/google`.

### Task 3: Document And Verify

**Files:** Modify `.env.example`, `README.md`

- [ ] Document `GOOGLE_TOKEN_ENCRYPTION_KEY`.
- [ ] Run `npm run db:push`, `npm test`, `npm run build`, `npm run test:e2e`, and `git diff --check`.
- [ ] Commit with `feat: encrypt google oauth tokens at rest`.
