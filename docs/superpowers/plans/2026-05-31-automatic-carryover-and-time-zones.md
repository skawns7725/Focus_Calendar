# Automatic Carryover And Time Zones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make missed-task carryover user-time-zone-aware, idempotent, scheduler-callable, visible through persisted notifications, and resolvable when the next day is full.

**Architecture:** Introduce an IANA time-zone helper and keep carryover orchestration in the scheduling service. Store the last processed local date on each task, persist carryover results through a notification repository, and expose narrow APIs for scheduler execution, unread notices, and explicit nearest-day movement.

**Tech Stack:** Next.js App Router, TypeScript, Prisma SQLite, Vitest, Testing Library, `Intl.DateTimeFormat`

---

## File Structure

- Create: `src/domain/time-zone.ts`
  Convert local dates and times to instants with IANA time zones, including DST.
- Create: `src/domain/time-zone.test.ts`
  Lock date boundaries and DST behavior.
- Modify: `prisma/schema.prisma`
  Add `lastCarryoverDate` to tasks.
- Modify: `src/domain/types.ts`
  Expose the new carryover marker.
- Modify: `src/server/quest-repository.ts`
  Persist the carryover marker and allow task deletion.
- Create: `src/server/notification-repository.ts`
  Persist and read carryover notifications.
- Modify: `src/server/services/scheduling-service.ts`
  Process only missed tasks, allocate priority order without overlap, and support nearest-day movement.
- Create: `src/server/services/scheduling-service.test.ts`
  Verify idempotency, future-task safety, slot competition, conflicts, and nearest-day resolution.
- Modify: `src/app/api/schedule/reconcile/route.ts`
  Enforce optional scheduler-secret authentication.
- Create: `src/app/api/notifications/route.ts`
  List unread notifications and mark them read.
- Create: `src/app/api/quests/[id]/move-nearest/route.ts`
  Resolve full-day conflicts explicitly.
- Modify: `src/client/api.ts`
  Call reconciliation, notification, and nearest-day APIs.
- Modify: `src/components/attention-panel.tsx`
  Render neutral conflict actions.
- Modify: `src/components/dashboard.tsx`
  Reconcile on open and display persisted notices.
- Modify: `src/components/quest-card.tsx`
  Show conflict controls for `needs_attention`.

### Task 1: Add IANA Time Zone Helpers

**Files:**
- Create: `src/domain/time-zone.ts`
- Create: `src/domain/time-zone.test.ts`

- [ ] **Step 1: Write failing time-zone tests**

```ts
expect(toLocalDate(new Date("2026-03-08T04:30:00Z"), "America/New_York")).toBe("2026-03-07");
expect(toInstant("2026-03-08", "09:00", "America/New_York").toISOString()).toBe("2026-03-08T13:00:00.000Z");
expect(addLocalDays("2026-03-08", 1)).toBe("2026-03-09");
expect(localWeekday("2026-03-08")).toBe(0);
```

- [ ] **Step 2: Run focused test and verify failure**

Run: `npm test -- src/domain/time-zone.test.ts`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement the helper**

Use `Intl.DateTimeFormat(...).formatToParts()` to derive zone-local parts. Resolve a local wall-clock time by iteratively correcting a UTC guess until formatted zone parts match the requested local date and time.

- [ ] **Step 4: Run focused test**

Run: `npm test -- src/domain/time-zone.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/time-zone.ts src/domain/time-zone.test.ts
git commit -m "feat: add time zone scheduling helpers"
```

### Task 2: Persist Carryover Markers And Notifications

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/domain/types.ts`
- Modify: `src/test/factories.ts`
- Modify: `src/server/quest-repository.ts`
- Create: `src/server/notification-repository.ts`

- [ ] **Step 1: Add the task marker to the schema**

```prisma
lastCarryoverDate String?
```

- [ ] **Step 2: Extend the domain task**

```ts
lastCarryoverDate: string | null;
```

- [ ] **Step 3: Add notification persistence**

```ts
export class NotificationRepository {
  create(notification: QuestNotification) {
    return db.notification.create({ data: notification });
  }
  listUnread() {
    return db.notification.findMany({ where: { readAt: null }, orderBy: { createdAt: "desc" } });
  }
  markRead(ids: string[]) {
    return db.notification.updateMany({ where: { id: { in: ids } }, data: { readAt: new Date() } });
  }
}
```

- [ ] **Step 4: Apply schema and run tests**

Run: `npm run db:push`

Run: `npm test`

Expected: PASS after task fixtures and repository mappings include the nullable marker.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/domain/types.ts src/test/factories.ts src/server/quest-repository.ts src/server/notification-repository.ts
git commit -m "feat: persist carryover markers and notifications"
```

### Task 3: Reconcile Only Missed Tasks Once Per Local Date

**Files:**
- Modify: `src/server/services/scheduling-service.ts`
- Create: `src/server/services/scheduling-service.test.ts`
- Modify: `src/server/services/index.ts`

- [ ] **Step 1: Write failing scheduling-service tests**

Use in-memory repositories and verify:

```ts
await service.reconcile(new Date("2026-06-02T01:00:00Z"));
expect(quests.get("missed")?.plannedStart).toBe("2026-06-02T00:00:00.000Z");
expect(quests.get("future")?.plannedStart).toBe("2026-06-03T00:00:00.000Z");
expect(notifications).toHaveLength(1);

await service.reconcile(new Date("2026-06-02T02:00:00Z"));
expect(quests.get("missed")?.carryoverCount).toBe(1);
expect(notifications).toHaveLength(1);
```

Also verify two tasks compete for non-overlapping slots in `sortQuests` priority order and a full next day creates one conflict notice.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- src/server/services/scheduling-service.test.ts`

Expected: FAIL because reconciliation is fixed-offset, non-idempotent, and processes future tasks.

- [ ] **Step 3: Implement local-date reconciliation**

Read the configured IANA zone. Filter tasks whose planned local date is before today and whose `lastCarryoverDate !== today`. Allocate slots in priority order while adding each successful task move to the in-memory fixed blocks. Persist one notification and marker per processed task.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- src/server/services/scheduling-service.test.ts`

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/scheduling-service.ts src/server/services/scheduling-service.test.ts src/server/services/index.ts
git commit -m "feat: reconcile missed tasks idempotently"
```

### Task 4: Add Explicit Nearest-Day Conflict Resolution

**Files:**
- Modify: `src/server/services/scheduling-service.ts`
- Modify: `src/server/services/scheduling-service.test.ts`
- Create: `src/app/api/quests/[id]/move-nearest/route.ts`

- [ ] **Step 1: Write failing nearest-day test**

```ts
expect((await service.moveToNearestAvailableDay("blocked", new Date("2026-06-02T01:00:00Z")))?.plannedStart)
  .toBe("2026-06-04T00:00:00.000Z");
```

- [ ] **Step 2: Run focused test and verify failure**

Run: `npm test -- src/server/services/scheduling-service.test.ts`

Expected: FAIL because explicit nearest-day movement does not exist.

- [ ] **Step 3: Implement bounded forward search**

Search up to 365 local days after the full next day. Reuse the same local-zone slot calculation. Update the task and store a `carried_over` notification after the user explicitly invokes the API.

- [ ] **Step 4: Run focused test**

Run: `npm test -- src/server/services/scheduling-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/scheduling-service.ts src/server/services/scheduling-service.test.ts src/app/api/quests/[id]/move-nearest/route.ts
git commit -m "feat: move conflicts to nearest available day"
```

### Task 5: Secure Scheduler Endpoint And Expose Notifications

**Files:**
- Modify: `.env.example`
- Create: `src/server/scheduler-auth.ts`
- Create: `src/server/scheduler-auth.test.ts`
- Modify: `src/app/api/schedule/reconcile/route.ts`
- Create: `src/app/api/notifications/route.ts`
- Modify: `src/client/api.ts`

- [ ] **Step 1: Write failing scheduler-auth tests**

```ts
expect(isSchedulerAuthorized(null, undefined)).toBe(true);
expect(isSchedulerAuthorized("Bearer valid", "valid")).toBe(true);
expect(isSchedulerAuthorized("Bearer wrong", "valid")).toBe(false);
```

- [ ] **Step 2: Run focused test and verify failure**

Run: `npm test -- src/server/scheduler-auth.test.ts`

Expected: FAIL because scheduler authentication does not exist.

- [ ] **Step 3: Implement auth and APIs**

Require `Authorization: Bearer <SCHEDULER_SECRET>` only when the environment secret is set. Add `GET /api/notifications` and `PATCH /api/notifications` for unread-list and mark-read behavior.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- src/server/scheduler-auth.test.ts`

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/server/scheduler-auth.ts src/server/scheduler-auth.test.ts src/app/api/schedule/reconcile/route.ts src/app/api/notifications/route.ts src/client/api.ts
git commit -m "feat: secure scheduled reconciliation"
```

### Task 6: Display Carryover Notices And Conflict Actions

**Files:**
- Modify: `src/components/attention-panel.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/components/quest-card.tsx`
- Modify: `src/components/quest-list.tsx`
- Create: `src/components/attention-panel.test.tsx`

- [ ] **Step 1: Write failing notice UI test**

```tsx
render(<AttentionPanel notifications={[{ id: "n1", kind: "conflict", questId: "q1", message: "다음 날 일정이 가득 찼습니다." }]} onRead={vi.fn()} />);
expect(screen.getByText("다음 날 일정이 가득 찼습니다.")).toBeInTheDocument();
```

- [ ] **Step 2: Run focused test and verify failure**

Run: `npm test -- src/components/attention-panel.test.tsx`

Expected: FAIL because the panel still exposes the prototype single-task interface.

- [ ] **Step 3: Implement dashboard notices and actions**

Render unread notices, mark them read after display, reconcile before dashboard refresh, and add `Move to nearest available day` plus `Edit manually` controls for `needs_attention` tasks.

- [ ] **Step 4: Run UI and full tests**

Run: `npm test -- src/components/attention-panel.test.tsx`

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components src/client/api.ts
git commit -m "feat: show carryover notices and conflict actions"
```

### Task 7: Verify Automatic Carryover

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document scheduler configuration**

Add `SCHEDULER_SECRET`, the hosted cron request contract, dashboard-open recovery, time-zone behavior, idempotency, and full-next-day conflict actions.

- [ ] **Step 2: Run verification sequentially**

Run: `npm test`

Run: `npm run db:push`

Run: `npm run build`

Run: `npm run test:e2e`

Expected: all tests and production build pass. Run build and E2E sequentially because both use Next.js output state.

- [ ] **Step 3: Commit docs**

```bash
git add README.md
git commit -m "docs: describe automatic carryover scheduling"
```
