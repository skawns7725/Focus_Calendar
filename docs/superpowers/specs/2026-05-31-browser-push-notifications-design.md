# Browser Push Notifications Design

## Scope

This increment adds browser Web Push notifications for task start reminders, automatic carryover, and scheduling conflicts. It reuses the existing persisted in-app notifications and scheduler endpoint.

Account-level data isolation and hosted deployment remain separate follow-up increments. The local implementation is fully testable with an injected push gateway. Production delivery requires deployment-time VAPID keys and HTTPS.

## First Visit Experience

On the first dashboard visit, show an in-app notification preference prompt exactly once.

- `Enable notifications` requests browser notification permission only after the user presses it.
- `Not now` stores an explicit disabled preference without requesting browser permission.
- After either choice, do not show the first-visit prompt again automatically.
- The settings page remains the only place to change the preference later.

Browser permission and app preference are separate:

- If the app preference is enabled but the browser permission is denied, show instructions to enable permission in browser settings.
- If the browser permission is later revoked outside the app, preserve the app preference and show the blocked state.
- Disabling notifications removes the current browser subscription but does not alter other devices.

## Notification Types

Web Push delivery supports:

- `start`: sent 10 minutes before a scheduled task starts by default;
- `carried_over`: sent after automatic or explicit carryover;
- `conflict`: sent when no valid slot is available.

The reminder lead time is a global user setting with a default of 10 minutes. The settings page allows changing it to a positive whole number of minutes.

## Multiple Devices

Each browser installation stores its own Push API subscription. A user may subscribe multiple devices. Local development uses the current local account; the later account-isolation increment will attach subscriptions to authenticated accounts.

Subscriptions are upserted by endpoint. Disabling notifications removes only the requesting browser's endpoint.

## Delivery Flow

### Carryover And Conflict

1. Scheduling reconciliation stores an in-app notification.
2. The notification delivery service sends the same message to active push subscriptions.
3. Push failure does not roll back the local carryover or remove the in-app notice.

### Start Reminder

1. The hosted scheduler calls the notification dispatch API periodically.
2. The delivery service selects incomplete scheduled tasks whose start time falls within the configured reminder window.
3. A delivery marker prevents sending the same start reminder more than once for the same task occurrence.
4. The service stores an in-app `start` notification and sends Web Push.

The existing scheduler route invokes both carryover reconciliation and reminder dispatch.

## Push Gateway

The delivery service depends on a narrow `PushGateway` interface:

```ts
interface PushGateway {
  send(subscription: StoredPushSubscription, payload: PushPayload): Promise<void>;
}
```

Production uses the `web-push` package and VAPID configuration. Tests inject a fake gateway without network access.

When the gateway reports HTTP `404` or `410`, remove the expired subscription. Other delivery errors are recorded and do not stop delivery to remaining devices.

## Service Worker

Add `public/sw.js`.

- Handle the `push` event and show a notification.
- Use a neutral title such as `Focus Calendar`.
- Open the dashboard when the user clicks a notification.
- Register the service worker only after the user enables notifications.

## Data Model Changes

Extend `Settings`:

- `notificationPromptCompleted Boolean @default(false)`
- `browserNotificationsEnabled Boolean @default(false)`
- `reminderMinutes Int @default(10)`

Add `PushSubscription`:

- `id`
- unique `endpoint`
- `p256dh`
- `auth`
- timestamps

Add `ReminderDelivery`:

- unique composite `(questId, scheduledStart)`
- `sentAt`

Extend `Notification`:

- `deliveredAt DateTime?`

## API And UI

Add:

- `GET /api/push/status`
- `POST /api/push/subscribe`
- `DELETE /api/push/subscribe`
- `POST /api/notifications/dispatch`

The status response exposes the public VAPID key, persisted app preference, first-visit completion, reminder minutes, and whether push is configured.

The dashboard shows the first-visit prompt only while `notificationPromptCompleted` is false. The settings page exposes enable, disable, blocked-state guidance, and reminder-minute editing.

## Security

- The public VAPID key may be returned to the browser.
- The VAPID private key remains server-side.
- Scheduler-triggered reminder dispatch uses the existing `SCHEDULER_SECRET`.
- Subscription payloads are validated before storage.
- Production requires HTTPS. `localhost` remains valid for local testing.

## Error Handling

- Permission denial stores a completed first-visit choice and shows browser-settings guidance.
- Push delivery failure does not remove in-app notifications.
- Expired subscriptions are removed automatically.
- Missing VAPID configuration shows a setup-required state without requesting browser permission.
- One failing subscription does not prevent delivery to other devices.

## Testing

Tests cover:

- initial settings defaults;
- first-visit prompt appears only before a choice;
- permission request happens only after `Enable notifications`;
- disabled preference does not request permission;
- subscription upsert and per-endpoint deletion;
- start reminder selection and idempotent marker;
- default and configurable reminder minutes;
- carryover and conflict Web Push delivery;
- expired-subscription cleanup;
- scheduler-secret protection for reminder dispatch;
- service-worker registration and subscription conversion;
- production build and existing E2E regression.

