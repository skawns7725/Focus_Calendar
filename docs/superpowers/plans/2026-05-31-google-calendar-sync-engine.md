# Google Calendar Sync Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement working incremental Google Calendar import and optional dedicated-calendar task synchronization with token refresh, signed OAuth state, manual sync, and dashboard-open sync.

**Architecture:** Keep Google HTTP details behind a gateway and inject that gateway into a sync service. Persist read cursors per imported calendar, event identity on imported busy blocks, and task-event mappings for the dedicated `Focus Calendar`. API routes and UI call the service without exposing OAuth tokens to the browser.

**Tech Stack:** Next.js App Router, TypeScript, Prisma SQLite, Vitest, Testing Library, Google Calendar REST API

---

## File Structure

- Modify: `prisma/schema.prisma`
  Add calendar import settings, imported event identity, per-calendar sync cursors, and mapping sync metadata.
- Modify: `src/server/settings-repository.ts`
  Read and persist Google import mode and selected calendar IDs.
- Modify: `src/server/services/settings-service.ts`
  Validate the new settings fields.
- Create: `src/server/google/google-oauth-state.ts`
  Sign and verify short-lived OAuth state.
- Modify: `src/server/google/google-auth.ts`
  Refresh expired access tokens.
- Modify: `src/server/google/google-connection-repository.ts`
  Persist refreshed tokens and sync result state.
- Modify: `src/server/google/google-calendar-client.ts`
  Expose calendar list, incremental events, and dedicated event CRUD through a gateway interface.
- Create: `src/server/google/google-sync-repository.ts`
  Persist cursors, busy blocks, mappings, and reconciliation updates.
- Modify: `src/server/google/google-sync-service.ts`
  Orchestrate refresh, import, invalid cursor recovery, writeback, reverse sync, and errors.
- Modify: `src/server/google/index.ts`
  Wire the production dependencies.
- Modify: `src/app/api/google/connect/route.ts`
  Emit signed OAuth state.
- Modify: `src/app/api/google/callback/route.ts`
  Verify OAuth state.
- Create: `src/app/api/google/calendars/route.ts`
  List calendars for selection.
- Create: `src/app/api/google/sync/route.ts`
  Run manual and dashboard-open sync.
- Modify: `src/client/api.ts`
  Add calendar-list and sync calls.
- Modify: `src/components/settings-page.tsx`
  Add import mode, selection, status, and manual sync controls.
- Modify: `src/components/dashboard.tsx`
  Trigger sync on open and after task mutation.

### Task 1: Persist Calendar Selection And Incremental Sync Identity

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/server/settings-repository.ts`
- Modify: `src/server/services/settings-service.ts`
- Test: `src/server/services/settings-service.test.ts`

- [ ] **Step 1: Write the failing settings validation test**

```ts
it("stores Google import selection", async () => {
  await service.update({ ...base, googleImportMode: "selected", selectedGoogleCalendarIds: ["primary", "work"] });
  expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
    googleImportMode: "selected",
    selectedGoogleCalendarIds: ["primary", "work"]
  }));
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- src/server/services/settings-service.test.ts`

Expected: FAIL because the new settings fields are not accepted.

- [ ] **Step 3: Add persistence fields and validation**

Add:

```prisma
model GoogleCalendarCursor {
  calendarId String @id
  syncToken  String?
  updatedAt  DateTime @updatedAt
}
```

Extend `Settings` with `googleImportMode String?` and `selectedGoogleCalendarIdsJson String @default("[]")`. Extend `CalendarBlock` with `calendarId String?` and `googleEventId String?`. Add `googleUpdatedAt DateTime?` to `GoogleEventMapping`.

Serialize selected IDs in `SettingsRepository` and validate `googleImportMode: z.enum(["all", "selected"]).nullable()` with `selectedGoogleCalendarIds: z.array(z.string())`.

- [ ] **Step 4: Apply schema and run the focused test**

Run: `npm run db:push`

Run: `npm test -- src/server/services/settings-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/server/settings-repository.ts src/server/services/settings-service.ts src/server/services/settings-service.test.ts
git commit -m "feat: persist google calendar import settings"
```

### Task 2: Add Signed OAuth State And Token Refresh

**Files:**
- Create: `src/server/google/google-oauth-state.ts`
- Create: `src/server/google/google-oauth-state.test.ts`
- Modify: `src/server/google/google-auth.ts`
- Modify: `src/server/google/google-connection-repository.ts`
- Modify: `src/app/api/google/connect/route.ts`
- Modify: `src/app/api/google/callback/route.ts`

- [ ] **Step 1: Write failing OAuth state and refresh tests**

```ts
it("rejects a modified oauth state", () => {
  const state = createGoogleOAuthState("read", "secret", 1000);
  expect(() => verifyGoogleOAuthState(`${state}x`, "secret", 1001)).toThrow();
});

it("refreshes an expired access token", async () => {
  const token = await refreshGoogleToken("refresh-token", fetchMock);
  expect(token.access_token).toBe("new-access");
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/server/google/google-oauth-state.test.ts src/server/google/google-auth.test.ts`

Expected: FAIL because state signing and refresh do not exist.

- [ ] **Step 3: Implement signed state and refresh**

Use Node `crypto.createHmac("sha256", secret)` over a base64url JSON payload `{ mode, expiresAt }`. Add `refreshGoogleToken(refreshToken, request = fetch)` posting `grant_type=refresh_token`. Preserve the existing refresh token when Google omits a replacement.

- [ ] **Step 4: Wire OAuth routes and verify**

Use `GOOGLE_OAUTH_STATE_SECRET`, falling back to `GOOGLE_CLIENT_SECRET` for local development. The connect route signs state. The callback verifies state before token exchange and chooses read or write mode from the verified payload.

Run: `npm test -- src/server/google/google-oauth-state.test.ts src/server/google/google-auth.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/google src/app/api/google/connect/route.ts src/app/api/google/callback/route.ts .env.example
git commit -m "feat: secure google oauth and refresh tokens"
```

### Task 3: Implement Google Calendar Gateway

**Files:**
- Modify: `src/server/google/google-calendar-client.ts`
- Modify: `src/server/google/google-calendar-client.test.ts`

- [ ] **Step 1: Write failing gateway tests**

Cover calendar listing, `syncToken`, cancelled events, `410` invalid-token error, create, update, and delete:

```ts
await client.listEvents("primary", { syncToken: "cursor" });
expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("syncToken=cursor"), expect.anything());

await client.updateTaskEvent("focus", "event-1", input);
await client.deleteTaskEvent("focus", "event-1");
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/server/google/google-calendar-client.test.ts`

Expected: FAIL because incremental read and event mutation methods do not exist.

- [ ] **Step 3: Implement gateway interface and methods**

Introduce `GoogleCalendarGateway` with `listCalendars`, `listEvents`, `ensureDedicatedCalendar`, `createTaskEvent`, `updateTaskEvent`, and `deleteTaskEvent`. Return typed event pages with `items` and `nextSyncToken`. Throw `GoogleSyncTokenExpiredError` on HTTP `410`.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/server/google/google-calendar-client.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/google/google-calendar-client.ts src/server/google/google-calendar-client.test.ts
git commit -m "feat: expand google calendar gateway"
```

### Task 4: Implement Incremental Import Service

**Files:**
- Create: `src/server/google/google-sync-repository.ts`
- Modify: `src/server/calendar/calendar-repository.ts`
- Modify: `src/server/google/google-sync-service.ts`
- Create: `src/server/google/google-sync-service.test.ts`

- [ ] **Step 1: Write failing import tests**

Use an in-memory repository and fake gateway to verify:

```ts
expect(await service.sync()).toMatchObject({ imported: 1 });
expect(repository.blocks).toContainEqual(expect.objectContaining({ googleEventId: "meeting" }));
expect(repository.cursors.get("primary")).toBe("next-cursor");
```

Also cover selected mode, dedicated-calendar exclusion, cancelled event removal, and `410` recovery through bounded full sync.

- [ ] **Step 2: Run focused test and verify failure**

Run: `npm test -- src/server/google/google-sync-service.test.ts`

Expected: FAIL because the orchestration repository and sync flow do not exist.

- [ ] **Step 3: Implement repository and import orchestration**

Select calendars from settings. Exclude the dedicated calendar from ordinary import. For each imported calendar, read changes with its cursor, upsert active events, remove cancelled events, and persist the returned cursor. On `GoogleSyncTokenExpiredError`, clear the cursor and retry a bounded full import horizon.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/server/google/google-sync-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/google/google-sync-repository.ts src/server/calendar/calendar-repository.ts src/server/google/google-sync-service.ts src/server/google/google-sync-service.test.ts
git commit -m "feat: import incremental google calendar changes"
```

### Task 5: Implement Dedicated Calendar Task Reconciliation

**Files:**
- Modify: `src/server/google/google-sync-repository.ts`
- Modify: `src/server/google/google-sync-service.ts`
- Modify: `src/server/google/google-sync-service.test.ts`
- Modify: `src/server/quest-repository.ts`

- [ ] **Step 1: Write failing bidirectional sync tests**

Cover task create, update, complete-delete, abandon-delete, Google-side title/time update, and Google-side mapped-event deletion:

```ts
await service.sync();
expect(gateway.createdEvents).toHaveLength(1);

gateway.events.set("focus", [{ id: "google-1", status: "cancelled" }]);
await service.sync();
expect(await quests.findById("quest-1")).toBeNull();
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/server/google/google-sync-service.test.ts`

Expected: FAIL because writeback and reverse reconciliation are not implemented.

- [ ] **Step 3: Implement dedicated-calendar reconciliation**

When two-way sync is enabled, ensure the dedicated calendar. Push unmapped scheduled tasks, patch changed mapped tasks, and delete mapped Google events for completed or abandoned tasks. Reconcile only mapped Google events back into tasks. Permanently delete a task when its mapped Google event is cancelled.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/server/google/google-sync-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/google/google-sync-repository.ts src/server/google/google-sync-service.ts src/server/google/google-sync-service.test.ts src/server/quest-repository.ts
git commit -m "feat: sync focus calendar task events"
```

### Task 6: Add Sync APIs And User Controls

**Files:**
- Modify: `src/server/google/index.ts`
- Create: `src/app/api/google/calendars/route.ts`
- Create: `src/app/api/google/sync/route.ts`
- Modify: `src/client/api.ts`
- Modify: `src/components/settings-page.tsx`
- Modify: `src/components/dashboard.tsx`
- Create: `src/components/settings-page.test.tsx`

- [ ] **Step 1: Write failing settings UI tests**

```tsx
expect(await screen.findByRole("button", { name: "지금 동기화" })).toBeInTheDocument();
await user.click(screen.getByLabelText("선택한 캘린더만"));
expect(await screen.findByLabelText("업무")).toBeInTheDocument();
```

- [ ] **Step 2: Run focused UI test and verify failure**

Run: `npm test -- src/components/settings-page.test.tsx`

Expected: FAIL because calendar selection and manual sync controls do not exist.

- [ ] **Step 3: Add routes, client calls, and UI**

Expose:

```ts
export async function syncGoogleCalendar() {
  return request("/api/google/sync", { method: "POST" });
}

export async function listGoogleCalendars() {
  return request("/api/google/calendars");
}
```

Settings renders the required first-selection prompt, mode radios, calendar checkboxes, last success/error status, retry action, and `지금 동기화`. Dashboard calls sync on open and after task mutations, then refreshes tasks.

- [ ] **Step 4: Run focused UI tests**

Run: `npm test -- src/components/settings-page.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/google/index.ts src/app/api/google src/client/api.ts src/components/settings-page.tsx src/components/dashboard.tsx src/components/settings-page.test.tsx
git commit -m "feat: expose google calendar sync controls"
```

### Task 7: Verify The Sync Engine

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document environment and behavior**

Add `GOOGLE_OAUTH_STATE_SECRET`, describe initial calendar selection, read-only default, dedicated-calendar opt-in, open/mutation/manual sync triggers, and local fake-gateway test coverage.

- [ ] **Step 2: Run full verification**

Run: `npm test`

Expected: all Vitest tests pass.

Run: `npm run db:push`

Expected: schema is applied successfully.

Run: `npm run build`

Expected: Next.js production build succeeds.

Run: `npm run test:e2e`

Expected: desktop and mobile Playwright flows pass.

Run: `npm audit --omit=dev`

Expected: zero production vulnerabilities.

- [ ] **Step 3: Commit documentation**

```bash
git add README.md
git commit -m "docs: describe google calendar sync behavior"
```

