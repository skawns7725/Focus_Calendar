# Google Login And Data Isolation Design

## Goal

Add Google login and isolate every user-owned record so one account can never read, edit, sync, or receive notifications for another account's data.

## Chosen Approach

Use the existing Google OAuth flow as the single login method. Read-only calendar connection also signs the user in. Requesting optional write permission keeps the same account and adds the dedicated `Focus Calendar` capability.

Alternatives considered:

- Add email and password login. This adds password reset, verification, and credential security work without improving the current Google Calendar-first product.
- Keep a shared local account behind a deployment password. This does not provide real data isolation and cannot support multiple users safely.

## Session Model

- Google OAuth requests `openid`, `email`, and `profile` in addition to calendar scopes.
- The OAuth callback fetches the Google profile, upserts a local user by Google subject, and creates a signed HTTP-only session cookie.
- Sessions are stored in the database as hashed opaque tokens with expiry timestamps. Raw tokens exist only in the cookie.
- Production requests without a valid session return `401`.
- Local development may use the existing `local` owner when no session exists so the current local workflow and test suite remain usable.
- A sign-out endpoint deletes the active session and clears the cookie.

## Ownership Model

Add `ownerId` to every user-owned model:

- `Quest`
- `CalendarBlock`
- `Settings`
- `Notification`
- `PushSubscription`
- `ReminderDelivery`
- `GoogleConnection`
- `GoogleEventMapping`
- `GoogleCalendarCursor`

Repository constructors receive an `ownerId`. Every query, update, delete, and upsert includes that owner. Compound unique constraints replace global unique constraints where an external identifier can repeat across accounts.

Existing local records keep the `local` owner during schema migration. They remain available only through the local development fallback and are never exposed to a signed-in production account.

## Request Flow

- Normal API routes resolve the current actor from the request cookie and construct owner-scoped services.
- Google read connection is also the login entry point and may start without an existing session.
- Google write permission requires an existing signed-in actor.
- The callback stores tokens only under the actor selected by the verified Google profile.
- Scheduled reconciliation and push dispatch iterate active owners and run isolated services for each owner.

## UI

- Add a compact account state in the shell.
- Signed-out production users see a Google login action instead of private schedule data.
- Signed-in users see their email and a sign-out action.
- Local development keeps the current direct dashboard workflow and labels the account as local development.

## Security Rules

- Session cookies use `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.
- Store only a SHA-256 hash of each session token.
- Reject write-permission OAuth starts without a signed-in actor.
- Never trust an `ownerId` from request JSON or query parameters.
- Scheduler endpoints continue requiring `SCHEDULER_SECRET` in production.

## Testing

- Unit-test session creation, lookup, expiry, and deletion.
- Unit-test owner-scoped repositories or scoped service factories with two users.
- Verify Google OAuth includes identity scopes and callback profile lookup.
- Verify scheduler fan-out isolates each owner.
- Keep current unit, build, and E2E checks passing under local development fallback.

## Out Of Scope

- Email and password login
- Team sharing
- Account merging
- Importing old local development data into a Google account
- Token encryption at rest, which remains a separate production-hardening task
