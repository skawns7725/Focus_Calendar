# Focus Calendar

Focus Calendar is a responsive schedule manager for deciding what to do next. It prioritizes tasks by deadline, importance, and carryover count, then uses imported calendar events as busy blocks.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Create a PostgreSQL database and set its connection string as `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. For local-only schema experiments, run `npm run db:push:local`. Do not use this command against Preview or Production databases.
6. Run `npm run dev`.
7. Open `http://localhost:3000`.

## Verification

```bash
npm test
npm run test:e2e
npm run db:validate
npm run db:migrate:status
npm run build
npm audit --omit=dev
```

### Playwright E2E Scope

The current Playwright specs are route-mock smoke tests. They verify UI rendering, selector stability, responsive layout basics, and the default user flow from the browser's point of view.

They do not verify real database persistence, authenticated owner isolation, Prisma relations, Preview or Production migration state, or the real Google OAuth flow. Run the Prisma and API checks against a safe local or Preview PostgreSQL database before treating a build as deployment-ready.

### Preview Core Smoke And Google OAuth Smoke

Core Preview smoke is independent from Google OAuth. It verifies login through the preview-only test route, dashboard loading, Quest creation, Today Focus ordering and explanation display, StudyPlan and StudyBlock creation, StudyBlock completion refresh, owner isolation, scheduler auth guard behavior, and 390px mobile overflow.

Run it against a Vercel Preview deployment with:

```bash
PREVIEW_CORE_SMOKE_URL="https://<preview-domain>" \
PREVIEW_TEST_LOGIN_SECRET="<preview-only-secret>" \
npm run test:e2e:preview-core
```

The preview-only login route is available only when `VERCEL_ENV=preview`, `PREVIEW_TEST_LOGIN_ENABLED=true`, and `PREVIEW_TEST_LOGIN_SECRET` is configured. It is disabled in Production and does not print or return the secret.

Google OAuth smoke is separate. It covers `/api/google/connect`, the OAuth callback, and read-only Google Calendar connection. If Google OAuth environment variables are absent in Preview, OAuth smoke should be reported as skipped or degraded, not as a Core smoke failure. Missing Google OAuth configuration must not block validation of Quest, Today Focus, StudyPlan, StudyBlock, owner isolation, or scheduler guards.

Production deployment readiness is based on successful CI PostgreSQL verification, successful Core Preview smoke, and clean Preview runtime logs. OAuth feature readiness is based on the separate OAuth smoke when Google OAuth environment variables are configured.

### CI PostgreSQL Verification

If local Docker or PostgreSQL is unavailable, use the `CI PostgreSQL` GitHub Actions workflow. It starts a disposable PostgreSQL service database and sets:

```env
DATABASE_URL=postgresql://focus_calendar_test:focus_calendar_test@localhost:5432/focus_calendar_test
```

The workflow runs Prisma migrations only against that disposable service database, then runs Prisma validation, migration status, unit/integration tests, build, route-mock Playwright smoke tests, and whitespace checks. It does not require Preview or Production database secrets.

Do not use a Production database URL for verification. Route-mock E2E tests do not replace PostgreSQL-backed tests for real persistence, owner isolation, Prisma relations, or migration state. Do not treat a build as deployment-ready until PostgreSQL-based `npm test`, `npm run db:validate`, and `npm run db:migrate:status` pass in a safe Local, Preview, or CI disposable database environment.

## Prisma Safety

- `npm run db:validate` checks `schema.prisma` without changing a database.
- `npm run db:migrate:status` is the preferred read-only migration check when `DATABASE_URL` points to a safe local or preview database.
- `npm run db:push:local` is for local development only. Do not run it against Preview or Production.
- Production and Preview databases must use separate `DATABASE_URL` values. Never point local commands at the Production URL.
- Existing databases that already match the current schema must not receive the baseline SQL directly. If `_prisma_migrations` needs to be aligned, inspect the live schema first and only then consider Prisma's `migrate resolve --applied` strategy in a controlled deployment run.
- Application builds generate Prisma Client but do not push or deploy migrations.

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
GOOGLE_TOKEN_ENCRYPTION_KEY="..."
GOOGLE_CALENDAR_WRITE_ENABLED="false"
SCHEDULER_SECRET="..."
VAPID_SUBJECT="mailto:admin@example.com"
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_ENVIRONMENT=""
SENTRY_AUTH_TOKEN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST=""
```

Use a separate random `GOOGLE_OAUTH_STATE_SECRET` outside local development. It signs short-lived OAuth callback state.
Set `GOOGLE_TOKEN_ENCRYPTION_KEY` to a base64-encoded 32-byte random key in production. It encrypts Google access and refresh tokens at rest. For example:

```bash
openssl rand -base64 32
```

## Google Calendar Sync

- Google Calendar read connection is also the Google login flow for hosted deployments.
- OAuth requests `openid`, `email`, and `profile` identity scopes together with calendar access.
- The default Google connection is read-only.
- After connecting, choose `all calendars` or `selected calendars only` before the first import.
- Imported calendars are used as busy blocks. The app never writes to them.
- Two-way sync requests broader permission only after the user enables it and `GOOGLE_CALENDAR_WRITE_ENABLED` is explicitly set to `true`.
- App-created tasks are written only to the dedicated non-primary `Focus Calendar`.
- Completing or deleting a task removes its dedicated Google event.
- Editing or deleting an app-created event in `Focus Calendar` is reflected back into the app.
- Sync runs when the dashboard opens, after task changes, and when `Sync now` is pressed in settings.
- Incremental cursors, expiry recovery, pagination, and token refresh are covered by local fake-gateway tests.

## Observability And Product Analytics

- Sentry is inactive unless `SENTRY_DSN` or `NEXT_PUBLIC_SENTRY_DSN` is configured.
- Sentry events pass through a scrubber that removes authorization headers, cookies, tokens, database URLs, raw titles, notes, descriptions, locations, emails, and Google event titles.
- To upload production source maps from Vercel, configure `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` in the deployment environment. Keep these values out of client code and do not print them in logs.
- PostHog is inactive unless `NEXT_PUBLIC_POSTHOG_KEY` is configured.
- PostHog events use product-safe payloads only, such as count, category, duration bucket, risk level, and source type. Do not send task titles, notes, locations, calendar event titles, descriptions, email addresses, tokens, or raw calendar details.

## Browser Push Notifications

- The dashboard asks about browser notifications once on the first visit. The saved choice can be changed later in settings.
- Each browser registers its own push subscription. Turning notifications off in settings removes only the current browser subscription.
- Start reminders default to 10 minutes before a task and can be changed in settings.
- Carryover and full-day conflicts also create push notifications.
- Production deployments must use HTTPS and configure VAPID keys. Localhost works without HTTPS for development.
- A hosted scheduler can dispatch pending notifications periodically:

```bash
curl -X POST https://example.com/api/notifications/dispatch \
  -H "Authorization: Bearer $SCHEDULER_SECRET"
```

Expired browser subscriptions are removed automatically after a push provider returns `404` or `410`.

## Accounts And Data Isolation

- Hosted production deployments require Google login before private API access.
- Every task, setting, imported calendar block, notification, push subscription, reminder marker, and Google sync record is stored under one owner.
- Scheduler requests fan out across owners only after `SCHEDULER_SECRET` authorization.
- Local development keeps a `local` owner fallback so `npm run dev` and the local E2E suite work without Google credentials.
- Existing local records remain under the local development owner and are not exposed to signed-in hosted accounts.

## Production Checklist

- Create a PostgreSQL database and configure `DATABASE_URL`.
- Configure HTTPS, Google OAuth, `GOOGLE_TOKEN_ENCRYPTION_KEY`, VAPID keys, and `SCHEDULER_SECRET`.
- Configure Vercel Cron or an equivalent scheduler with `Authorization: Bearer $SCHEDULER_SECRET`.
- Back up the PostgreSQL database regularly.

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

When `SCHEDULER_SECRET` is unset, local POST calls are allowed without the header for the signed-in or local development owner. Hosted cron GET calls require the secret.

## Vercel Hobby Deployment

1. Push this repository to GitHub.
2. Import the repository as a new project in [Vercel](https://vercel.com/new).
3. Open the project's `Storage` tab, install [Neon](https://vercel.com/marketplace/neon), choose the free plan, and connect the resource to the project.
4. Confirm that the Neon integration added `DATABASE_URL`.
5. Add the Google OAuth, token-encryption, VAPID, and scheduler environment variables under `Settings > Environment Variables`.
6. Redeploy the project.
7. Set `GOOGLE_REDIRECT_URI` to `https://<project-domain>/api/google/callback`, add the exact URI in Google Cloud Console, and redeploy again.
8. Use the included `vercel.json` cron configuration or create equivalent scheduler calls.

Vercel uses the `vercel-build` script to generate Prisma Client before compiling the application. It does not push schema changes to Neon.

## Container Deployment

Build and run the application with an external PostgreSQL database:

```bash
docker build -t focus-calendar .
docker run --rm -p 3000:3000 \
  --env-file .env.production \
  focus-calendar
```

Use HTTPS in production. Set `GOOGLE_REDIRECT_URI` to the deployed `/api/google/callback` URL and register that exact URL in Google Cloud Console. The container starts the server without applying schema changes.

Configure the hosting platform scheduler:

```bash
# Every 15 minutes
curl -X POST https://example.com/api/schedule/reconcile \
  -H "Authorization: Bearer $SCHEDULER_SECRET"

# Every 5 minutes
curl -X POST https://example.com/api/notifications/dispatch \
  -H "Authorization: Bearer $SCHEDULER_SECRET"
```

Mobile users can install the responsive site as a home-screen shortcut through the browser menu.
