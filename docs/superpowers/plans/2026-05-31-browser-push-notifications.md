# Browser Push Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-visit notification preference, per-browser Web Push subscriptions, start reminders, carryover and conflict delivery, expired-subscription cleanup, and settings controls.

**Architecture:** Persist notification preference in settings, browser subscriptions by endpoint, and reminder-delivery markers per task occurrence. Keep network delivery behind an injected `PushGateway`. Register a service worker only after the user explicitly enables notifications.

**Tech Stack:** Next.js App Router, TypeScript, Prisma SQLite, Vitest, Testing Library, browser Push API, service workers, `web-push`

---

## File Structure

- Modify: `prisma/schema.prisma`
  Add push settings, subscriptions, reminder markers, and notification delivery timestamps.
- Modify: `src/server/settings-repository.ts`
  Persist push preference and reminder minutes.
- Modify: `src/server/services/settings-service.ts`
  Validate push settings.
- Create: `src/server/push/push-types.ts`
  Define subscription and payload contracts.
- Create: `src/server/push/push-subscription-repository.ts`
  Store and remove browser subscriptions.
- Create: `src/server/push/reminder-repository.ts`
  Select due reminders and persist delivery markers.
- Create: `src/server/push/push-gateway.ts`
  Wrap `web-push` VAPID delivery.
- Create: `src/server/push/push-service.ts`
  Orchestrate reminder and in-app notification delivery.
- Modify: `src/server/notification-repository.ts`
  List undelivered notices and mark delivery.
- Modify: `src/server/services/scheduling-service.ts`
  Leave notices persisted for push dispatch.
- Modify: `src/app/api/schedule/reconcile/route.ts`
  Dispatch push notices and reminders after reconciliation.
- Create: `src/app/api/notifications/dispatch/route.ts`
  Dispatch push from hosted scheduler calls.
- Create: `src/app/api/push/status/route.ts`
  Return push configuration and preference.
- Create: `src/app/api/push/subscribe/route.ts`
  Add and remove current-browser subscriptions.
- Create: `src/client/push.ts`
  Request permission, register service worker, and serialize browser subscription.
- Create: `public/sw.js`
  Display received notifications and open dashboard on click.
- Create: `src/components/notification-preference-prompt.tsx`
  Show the first-visit prompt once.
- Modify: `src/components/dashboard.tsx`
  Load status and show first-visit prompt.
- Modify: `src/components/settings-page.tsx`
  Add notification preference and reminder controls.

### Task 1: Persist Push Preference And Subscriptions

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/server/settings-repository.ts`
- Modify: `src/server/services/settings-service.ts`
- Modify: `src/server/services/settings-service.test.ts`
- Create: `src/server/push/push-subscription-repository.ts`

- [ ] **Step 1: Write failing settings test**

```ts
await service.update({
  ...baseSettings,
  notificationPromptCompleted: true,
  browserNotificationsEnabled: true,
  reminderMinutes: 10
});
expect(repository.update).toHaveBeenCalledWith(expect.objectContaining({
  notificationPromptCompleted: true,
  browserNotificationsEnabled: true,
  reminderMinutes: 10
}));
```

- [ ] **Step 2: Run focused test**

Run: `npm test -- src/server/services/settings-service.test.ts`

Expected: FAIL because push settings are stripped.

- [ ] **Step 3: Add schema and persistence**

Add:

```prisma
notificationPromptCompleted Boolean @default(false)
browserNotificationsEnabled Boolean @default(false)
reminderMinutes Int @default(10)

model PushSubscription {
  id String @id @default(cuid())
  endpoint String @unique
  p256dh String
  auth String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ReminderDelivery {
  id String @id @default(cuid())
  questId String
  scheduledStart DateTime
  sentAt DateTime @default(now())
  @@unique([questId, scheduledStart])
}
```

Add `deliveredAt DateTime?` to `Notification`. Validate `reminderMinutes` as a positive integer.

- [ ] **Step 4: Apply schema and test**

Run: `npm run db:push`

Run: `npm test -- src/server/services/settings-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/server/settings-repository.ts src/server/services/settings-service.ts src/server/services/settings-service.test.ts src/server/push/push-subscription-repository.ts
git commit -m "feat: persist browser push preferences"
```

### Task 2: Deliver Push And Start Reminders

**Files:**
- Create: `src/server/push/push-types.ts`
- Create: `src/server/push/push-service.ts`
- Create: `src/server/push/push-service.test.ts`
- Create: `src/server/push/push-gateway.ts`
- Create: `src/server/push/reminder-repository.ts`
- Modify: `src/server/notification-repository.ts`

- [ ] **Step 1: Write failing push-service tests**

Use fakes and verify:

```ts
await service.dispatch(new Date("2026-06-01T08:50:00Z"));
expect(gateway.sent).toContainEqual(expect.objectContaining({ payload: expect.objectContaining({ kind: "start" }) }));
await service.dispatch(new Date("2026-06-01T08:51:00Z"));
expect(gateway.sent).toHaveLength(1);
```

Also cover persisted carryover/conflict delivery, configurable reminder minutes, and cleanup when the gateway throws `ExpiredPushSubscriptionError`.

- [ ] **Step 2: Run focused test**

Run: `npm test -- src/server/push/push-service.test.ts`

Expected: FAIL because push service does not exist.

- [ ] **Step 3: Implement push service**

Select undelivered notices, active subscriptions, and due incomplete tasks. Store start notifications and reminder markers before send. Deliver independently to every endpoint. Remove only expired endpoints. Mark notices delivered after dispatch attempt.

- [ ] **Step 4: Run focused test**

Run: `npm test -- src/server/push/push-service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/push src/server/notification-repository.ts
git commit -m "feat: dispatch browser push notifications"
```

### Task 3: Expose Scheduler And Subscription APIs

**Files:**
- Modify: `.env.example`
- Modify: `src/server/services/index.ts`
- Modify: `src/app/api/schedule/reconcile/route.ts`
- Create: `src/app/api/notifications/dispatch/route.ts`
- Create: `src/app/api/push/status/route.ts`
- Create: `src/app/api/push/subscribe/route.ts`
- Modify: `src/client/api.ts`

- [ ] **Step 1: Add VAPID configuration**

```env
VAPID_SUBJECT="mailto:admin@example.com"
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
```

- [ ] **Step 2: Wire server dependencies**

Expose push status, subscribe, unsubscribe, and scheduler-protected dispatch. Invoke dispatch after reconciliation.

- [ ] **Step 3: Add client API calls**

```ts
export async function getPushStatus() { return request("/api/push/status"); }
export async function subscribePush(input: unknown) { return request("/api/push/subscribe", { method: "POST", body: JSON.stringify(input) }); }
export async function unsubscribePush(endpoint: string) { return request("/api/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) }); }
```

- [ ] **Step 4: Run full tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .env.example src/server/services/index.ts src/app/api src/client/api.ts
git commit -m "feat: expose browser push APIs"
```

### Task 4: Register Service Worker And First-Visit Prompt

**Files:**
- Create: `src/client/push.ts`
- Create: `src/client/push.test.ts`
- Create: `public/sw.js`
- Create: `src/components/notification-preference-prompt.tsx`
- Create: `src/components/notification-preference-prompt.test.tsx`
- Modify: `src/components/dashboard.tsx`

- [ ] **Step 1: Write failing client helper and prompt tests**

```ts
expect(await enableBrowserNotifications("public-key")).toEqual(expect.objectContaining({ endpoint: "https://push.example/device" }));
expect(permissionRequest).toHaveBeenCalledTimes(1);

render(<NotificationPreferencePrompt status={{ notificationPromptCompleted: false, configured: true }} onEnable={vi.fn()} onDisable={vi.fn()} />);
expect(screen.getByRole("button", { name: "알림 켜기" })).toBeInTheDocument();
```

- [ ] **Step 2: Run focused tests**

Run: `npm test -- src/client/push.test.ts src/components/notification-preference-prompt.test.tsx`

Expected: FAIL because client helper and prompt do not exist.

- [ ] **Step 3: Implement browser helper and prompt**

Register `/sw.js`, request permission only inside `enableBrowserNotifications`, convert the VAPID key, subscribe, and return a serializable endpoint/key payload. `Not now` stores disabled preference without requesting browser permission. Dashboard loads status and renders the prompt only before the first choice.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- src/client/push.test.ts src/components/notification-preference-prompt.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/sw.js src/client/push.ts src/client/push.test.ts src/components/notification-preference-prompt.tsx src/components/notification-preference-prompt.test.tsx src/components/dashboard.tsx
git commit -m "feat: prompt for browser notifications once"
```

### Task 5: Add Notification Settings Controls

**Files:**
- Modify: `src/components/settings-page.tsx`
- Modify: `src/components/settings-page.test.tsx`

- [ ] **Step 1: Write failing settings UI tests**

```tsx
expect(await screen.findByText("브라우저 알림")).toBeInTheDocument();
expect(screen.getByLabelText("시작 전 알림")).toHaveValue(10);
```

- [ ] **Step 2: Run focused test**

Run: `npm test -- src/components/settings-page.test.tsx`

Expected: FAIL because push controls do not exist.

- [ ] **Step 3: Implement controls**

Show configured, enabled, disabled, and blocked states. Enable and disable the current browser through the browser helper and API. Persist reminder minutes through settings.

- [ ] **Step 4: Run focused and full tests**

Run: `npm test -- src/components/settings-page.test.tsx`

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/settings-page.tsx src/components/settings-page.test.tsx
git commit -m "feat: manage browser notifications in settings"
```

### Task 6: Verify Browser Push Notifications

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document Web Push setup**

Add VAPID variables, HTTPS requirement, first-visit behavior, reminder default, scheduler delivery, and local fake-gateway testing.

- [ ] **Step 2: Install production dependency**

Run: `npm install web-push`

Expected: package installs successfully.

- [ ] **Step 3: Run verification sequentially**

Run: `npm test`

Run: `npm run db:push`

Run: `npm run build`

Run: `npm run test:e2e`

Expected: all tests and production build pass.

- [ ] **Step 4: Commit**

```bash
git add README.md package.json package-lock.json
git commit -m "docs: describe browser push setup"
```

