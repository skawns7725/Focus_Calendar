# Google Login And Data Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google login with signed database-backed sessions and scope all private records to one owner.

**Architecture:** The existing Google OAuth callback becomes the identity boundary by fetching the Google profile after token exchange. A small auth module resolves a signed cookie to an owner ID, while repository constructors bind every database query to that owner. Scheduler endpoints use an owner registry to fan out reconciliation and push delivery without crossing account boundaries.

**Tech Stack:** Next.js App Router, TypeScript, Prisma SQLite, Vitest, Playwright, Node `crypto`

---

### Task 1: Persist Users, Sessions, And Owners

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/server/auth/session-repository.test.ts`
- Create: `src/server/auth/session-repository.ts`

- [ ] **Step 1: Write failing session persistence tests**

Test that `create(ownerId)`, `findOwner(token)`, expired lookup, and `delete(token)` work while only token hashes are persisted.

- [ ] **Step 2: Run the focused test**

Run: `npm test -- src/server/auth/session-repository.test.ts`
Expected: FAIL because the repository does not exist.

- [ ] **Step 3: Add schema ownership**

Add `User` and `Session`, then add `ownerId String @default("local")` to each user-owned model. Replace globally unique external IDs with owner-scoped compound uniqueness, including:

```prisma
@@unique([ownerId, externalId])
@@unique([ownerId, endpoint])
@@unique([ownerId, questId, scheduledStart])
@@unique([ownerId, calendarId])
```

- [ ] **Step 4: Implement hashed session persistence**

Use `randomBytes(32).toString("base64url")`, SHA-256 hashes, and a 30-day expiry. Return raw tokens only from `create`.

- [ ] **Step 5: Apply schema and verify**

Run: `npm run db:push`
Expected: Prisma schema applied and client generated.

Run: `npm test -- src/server/auth/session-repository.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/server/auth
git commit -m "feat: persist users and signed-in sessions"
```

### Task 2: Resolve Request Actors

**Files:**
- Create: `src/server/auth/auth-service.test.ts`
- Create: `src/server/auth/auth-service.ts`
- Create: `src/server/auth/cookies.ts`

- [ ] **Step 1: Write failing auth tests**

Cover valid cookie resolution, expired cookie rejection, production `401`, local development fallback to `local`, and cookie serialization flags.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- src/server/auth/auth-service.test.ts`
Expected: FAIL because actor resolution does not exist.

- [ ] **Step 3: Implement actor resolution**

Expose:

```ts
export interface Actor { ownerId: string; email?: string; localDevelopment: boolean }
export async function getActor(request: Request): Promise<Actor | null>
export async function requireActor(request: Request): Promise<Actor>
```

Use the `focus_session` cookie. Permit `{ ownerId: "local", localDevelopment: true }` only when `NODE_ENV !== "production"`.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/server/auth/auth-service.test.ts`
Expected: PASS.

```bash
git add src/server/auth
git commit -m "feat: resolve authenticated request actors"
```

### Task 3: Scope Core Repositories

**Files:**
- Modify: `src/server/quest-repository.ts`
- Modify: `src/server/settings-repository.ts`
- Modify: `src/server/calendar/calendar-repository.ts`
- Modify: `src/server/notification-repository.ts`
- Modify: `src/server/push/push-subscription-repository.ts`
- Modify: `src/server/push/reminder-repository.ts`
- Create: `src/server/services/user-services.ts`
- Modify: `src/server/services/index.ts`
- Create: `src/server/services/user-services.test.ts`

- [ ] **Step 1: Write a failing two-owner isolation test**

Create services for `owner-a` and `owner-b`, save one quest and notification under each, and assert each list returns only its own records.

- [ ] **Step 2: Run focused test**

Run: `npm test -- src/server/services/user-services.test.ts`
Expected: FAIL because repositories are global.

- [ ] **Step 3: Bind repositories to owners**

Give each repository `constructor(private readonly ownerId = "local")`. Add `ownerId` to creates and owner filters to reads, updates, deletes, and upserts.

- [ ] **Step 4: Add scoped service factory**

Expose:

```ts
export function createUserServices(ownerId: string) {
  const quests = new PrismaQuestRepository(ownerId);
  const settings = new SettingsRepository(ownerId);
  // construct the remaining scoped repositories and services
  return { questService, settingsService, schedulingService, notificationRepository, pushSubscriptionRepository, pushService };
}
```

Keep local exports temporarily backed by `createUserServices("local")` so focused migrations remain incremental.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/server/services/user-services.test.ts`
Expected: PASS.

```bash
git add src/server
git commit -m "feat: scope core services by owner"
```

### Task 4: Scope Google Sync Repositories

**Files:**
- Modify: `src/server/google/google-connection-repository.ts`
- Modify: `src/server/google/google-sync-repository.ts`
- Modify: `src/server/google/index.ts`
- Modify: `src/server/google/google-sync-service.test.ts`

- [ ] **Step 1: Add failing two-owner Google repository coverage**

Assert two owners can keep independent connections, cursors, mappings, and imported blocks with the same Google external identifiers.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- src/server/google/google-sync-service.test.ts`
Expected: FAIL until repository construction is owner-scoped.

- [ ] **Step 3: Bind Google repositories**

Construct Google connection and sync repositories with `ownerId`, use owner-scoped compound keys, and expose `createGoogleServices(ownerId)`.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/server/google`
Expected: PASS.

```bash
git add src/server/google
git commit -m "feat: isolate google sync by owner"
```

### Task 5: Turn Google OAuth Into Login

**Files:**
- Modify: `src/server/google/google-scopes.ts`
- Modify: `src/server/google/google-auth.ts`
- Modify: `src/server/google/google-auth.test.ts`
- Modify: `src/server/google/google-oauth-state.ts`
- Modify: `src/server/google/google-oauth-state.test.ts`
- Modify: `src/app/api/google/connect/route.ts`
- Modify: `src/app/api/google/callback/route.ts`
- Create: `src/app/api/auth/status/route.ts`
- Create: `src/app/api/auth/sign-out/route.ts`

- [ ] **Step 1: Write failing identity tests**

Require `openid`, `email`, and `profile` scopes; test Google user-info lookup; verify write authorization starts reject a missing signed-in actor.

- [ ] **Step 2: Run focused tests**

Run: `npm test -- src/server/google`
Expected: FAIL on missing identity behavior.

- [ ] **Step 3: Implement login callback**

Fetch `https://openidconnect.googleapis.com/v1/userinfo`, upsert `User` by `sub`, create a session, write the cookie, and save calendar tokens under that owner. Keep read mode valid for signed-out users and require an actor for write mode.

- [ ] **Step 4: Add status and sign-out**

Return `{ signedIn, email, localDevelopment }` from status. Delete the session token and expire the cookie on sign-out.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- src/server/google src/server/auth`
Expected: PASS.

```bash
git add src/server/google src/server/auth src/app/api/auth src/app/api/google
git commit -m "feat: sign in with google calendar oauth"
```

### Task 6: Protect API Routes And Fan Out Scheduler Work

**Files:**
- Modify: `src/app/api/**/route.ts`
- Create: `src/server/services/owner-registry.ts`
- Create: `src/server/services/owner-registry.test.ts`

- [ ] **Step 1: Write failing owner fan-out tests**

Assert scheduler iteration returns `local` in development and every stored user owner in production fixtures, once each.

- [ ] **Step 2: Run focused test**

Run: `npm test -- src/server/services/owner-registry.test.ts`
Expected: FAIL because registry does not exist.

- [ ] **Step 3: Resolve actors in normal APIs**

For each private route, call `requireActor(request)` and use `createUserServices(actor.ownerId)` or `createGoogleServices(actor.ownerId)`. Keep scheduler authorization, then iterate owners and dispatch isolated services.

- [ ] **Step 4: Verify and commit**

Run: `npm test`
Expected: PASS.

```bash
git add src/app src/server
git commit -m "feat: enforce owner isolation in api routes"
```

### Task 7: Add Account UI

**Files:**
- Modify: `src/client/api.ts`
- Modify: `src/components/app-shell.tsx`
- Create: `src/components/account-status.test.tsx`
- Create: `src/components/account-status.tsx`

- [ ] **Step 1: Write failing account UI test**

Cover Google login action while signed out, email and sign-out while signed in, and local development label.

- [ ] **Step 2: Run focused test**

Run: `npm test -- src/components/account-status.test.tsx`
Expected: FAIL because component does not exist.

- [ ] **Step 3: Implement compact account status**

Add `getAuthStatus()` and `signOut()` client calls. Render the account status inside the shell without changing existing mobile navigation.

- [ ] **Step 4: Verify and commit**

Run: `npm test -- src/components/account-status.test.tsx`
Expected: PASS.

```bash
git add src/client src/components
git commit -m "feat: show google account controls"
```

### Task 8: Final Verification And Documentation

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Document sessions and Google login**

Describe identity scopes, local development fallback, production sign-in requirement, and account isolation.

- [ ] **Step 2: Run complete verification**

Run sequentially:

```bash
npm run db:push
npm test
npm run build
npm run test:e2e
git diff --check
```

Expected: schema sync succeeds, all tests pass, production build succeeds, E2E passes, and diff check reports no errors.

- [ ] **Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: explain google login and account isolation"
```
