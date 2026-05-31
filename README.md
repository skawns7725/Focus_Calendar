# Focus Calendar

Focus Calendar is a responsive schedule manager for deciding what to do next. It prioritizes tasks by deadline, importance, and carryover count, then uses imported calendar events as busy blocks.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:push`.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.

## Verification

```bash
npm test
npm run test:e2e
npm run build
npm audit --omit=dev
```

## Google Cloud OAuth Setup

1. Create a `Focus Calendar` project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable `Google Calendar API` under `APIs & Services`.
3. Configure the OAuth consent screen.
4. Create an OAuth client with the `Web application` type.
5. Add `http://localhost:3000/api/google/callback` as an authorized redirect URI.
6. Add the issued values to `.env`.

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/google/callback"
GOOGLE_OAUTH_STATE_SECRET="..."
SCHEDULER_SECRET="..."
```

Use a separate random `GOOGLE_OAUTH_STATE_SECRET` outside local development. It signs short-lived OAuth callback state.

## Google Calendar Sync

- The default Google connection is read-only.
- After connecting, choose `all calendars` or `selected calendars only` before the first import.
- Imported calendars are used as busy blocks. The app never writes to them.
- Two-way sync requests broader permission only after the user enables it.
- App-created tasks are written only to the dedicated non-primary `Focus Calendar`.
- Completing or deleting a task removes its dedicated Google event.
- Editing or deleting an app-created event in `Focus Calendar` is reflected back into the app.
- Sync runs when the dashboard opens, after task changes, and when `Sync now` is pressed in settings.
- Incremental cursors, expiry recovery, pagination, and token refresh are covered by local fake-gateway tests.

## Remaining Production Work

The local app still needs account-level data isolation, a hosted scheduler configuration, browser push delivery, encrypted token storage, and deployment configuration before public release.

## Automatic Carryover

- A missed task stays visible for the rest of its scheduled local day.
- After the configured IANA time-zone date changes, reconciliation moves it once to the earliest open slot on the current day.
- Future tasks are left unchanged.
- If the day is full, the task stays visible with a conflict action. The app searches later dates only after the user presses `Move to nearest available day`.
- Dashboard opening performs a recovery reconciliation. A hosted scheduler can also call the same endpoint periodically:

```bash
curl -X POST http://localhost:3000/api/schedule/reconcile \
  -H "Authorization: Bearer $SCHEDULER_SECRET"
```

When `SCHEDULER_SECRET` is unset, local calls are allowed without the header. In production, configure a random secret and schedule this request every 15 minutes.
