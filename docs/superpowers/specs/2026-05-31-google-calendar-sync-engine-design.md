# Google Calendar Sync Engine Design

## Scope

This increment turns the existing Google Calendar OAuth preparation into a working sync engine. It covers token refresh, calendar selection, read-only busy-block import, dedicated `Focus Calendar` task writeback, incremental sync, manual sync, and sync status reporting.

Account sign-in, user data isolation, scheduled carryover, browser push delivery, and production deployment remain separate follow-up increments.

## Permission Model

- The default Google connection requests read-only Calendar access.
- Two-way sync remains an explicit opt-in setting.
- Enabling two-way sync requests the broader Calendar scope only after the user chooses it.
- The app never writes to the user's primary or imported calendars.
- The app writes only to a non-primary calendar named `Focus Calendar`.

## Initial Calendar Selection

After the first Google connection, the app shows calendar selection before running the first import.

The user chooses one of two modes:

1. Import all connected Google calendars.
2. Import only selected Google calendars.

The selected mode and selected calendar IDs are stored in settings. When selected-calendar mode is active, the user can revise the checked calendars later.

The dedicated `Focus Calendar` is excluded from read-only busy-block imports so app-created task events do not block their own scheduling.

## Sync Triggers

Sync runs:

- when the app dashboard opens;
- immediately after an internal task is created, updated, completed, or deleted;
- when the user presses `Sync now` in settings.

There is no periodic polling in this increment.

## Incremental Read Sync

The first import reads the configured calendars over a bounded scheduling horizon and stores imported events as busy `CalendarBlock` records.

Subsequent imports use Google Calendar `syncToken` values per imported calendar. Changed events update local blocks. Cancelled events remove local blocks. If Google invalidates a sync token, the engine clears that calendar's token and performs a bounded full resync.

Recurring Google events are imported as expanded instances by using `singleEvents=true`.

## Dedicated Calendar Writeback

When two-way sync is enabled, incomplete internal tasks with scheduled times are represented as events in the dedicated `Focus Calendar`.

- Creating or scheduling a task creates its Google event.
- Updating title, start, or end updates its Google event.
- Completing or deleting a task deletes its Google event.
- The app keeps completion history internally after completion.

The mapping between internal tasks and Google event IDs is stored locally.

## Changes Made In Google Calendar

During sync, events inside the dedicated `Focus Calendar` are reconciled back into the app:

- title changes update the internal task title;
- start or end changes update the internal task schedule;
- deleting an app-created event permanently deletes the corresponding internal task and mapping.

Only mapped app-created events participate in this reconciliation. A manually created event inside the dedicated calendar is treated as an ordinary busy block and does not create an internal task.

## Token Refresh And Errors

Before Calendar API calls, the engine refreshes expired access tokens when a refresh token is available. A refreshed token is persisted.

Sync failures do not delete the last known local calendar blocks or internal tasks. The connection stores the latest sync error and successful sync timestamp. Settings displays the current connection state and error message with a retry action.

If Google authorization is revoked, internal tasks and imported blocks remain visible until the user reconnects or explicitly disconnects.

## Security

- OAuth callback state uses a short-lived signed value instead of a raw mode string.
- Tokens remain server-side and are never exposed to the browser.
- Production deployment must encrypt stored OAuth tokens. Local development may use the existing local database storage until the deployment increment introduces an encryption secret.

## Data Model Changes

- Store import mode and selected Google calendar IDs.
- Store one incremental read-sync cursor per imported calendar.
- Store sufficient event identity on imported blocks to update and remove individual Google events.
- Extend Google event mappings with sync metadata required to reconcile dedicated-calendar changes.

## User Interface

Settings gains:

- connected-calendar selection shown after first connection;
- `all calendars` and `selected calendars only` modes;
- a selectable calendar list;
- a `Sync now` button;
- latest successful sync time;
- latest sync error and retry action.

The dashboard triggers a background sync on open and refreshes its task list after sync completes.

## Testing

Tests use a fake Google Calendar gateway and cover:

- refresh-token exchange before an expired-token sync;
- first import and incremental update, deletion, and invalid-token recovery;
- calendar selection modes;
- exclusion of the dedicated calendar from busy-block import;
- writeback create, update, complete-delete, and task-delete flows;
- reconciliation of Google-side title, time, and deletion changes;
- sync error persistence without loss of existing local records;
- OAuth signed-state validation;
- settings selection and manual-sync UI behavior.

