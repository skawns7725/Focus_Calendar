# Container Deployment And PWA Design

## Goal

Package Focus Calendar as a production-ready single Node container with persistent SQLite storage, scheduler instructions, and a mobile install shortcut.

## Architecture

- Build and run the Next.js standalone server in Docker.
- Mount `/data` as a persistent volume and set `DATABASE_URL=file:/data/focus-calendar.db`.
- Run `prisma db push` before starting the server so a fresh volume initializes itself.
- Keep one application replica because SQLite is a single-file database.
- Use the hosting platform scheduler to call reconciliation every 15 minutes and notification dispatch every 5 minutes with `SCHEDULER_SECRET`.

## Mobile Web App

- Add a web app manifest with the `Focus Calendar` name, standalone display mode, light background, and theme color.
- Add manifest metadata to the root layout.
- Keep the existing responsive mobile UI and service worker. Installation remains an optional browser home-screen shortcut.

## Configuration

Document required production variables:

- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_OAUTH_STATE_SECRET`
- `SCHEDULER_SECRET`
- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

## Constraints

- HTTPS is required for OAuth callbacks and Web Push outside localhost.
- The SQLite deployment must use exactly one running application replica with a persistent disk.
- Token encryption at rest remains a separate hardening step.

## Verification

- Build the Docker image.
- Run the normal DB sync, unit, production build, and E2E checks.
- Verify the manifest route is included by the Next.js build.
