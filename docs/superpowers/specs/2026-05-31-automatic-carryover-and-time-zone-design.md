# Automatic Carryover And Time Zone Design

## Scope

This increment makes missed-task carryover reliable in production. It adds user-time-zone-aware date calculations, idempotent reconciliation, a hosted scheduler endpoint, dashboard-open recovery, persisted carryover notifications, and conflict actions for a full next day.

Browser push delivery remains the next increment. This increment stores notifications and shows the user what happened inside the app.

## Product Rules

- An incomplete task remains visible at its original time for the rest of its scheduled day.
- After that day ends in the user's configured time zone, the task moves once to the earliest available slot on the next calendar day.
- A task is never moved hour by hour during the same day.
- A task is never moved merely because it is scheduled in the future.
- Completing or deleting a task prevents future carryover.
- Deadline, importance, and carryover count continue to determine list priority.

## Full Next Day

If the next day has no slot long enough for the missed task:

- keep the task visible with `needs_attention`;
- do not automatically move it to a more distant date;
- store a conflict notification;
- show that the next day is full;
- offer `Move to nearest available day` and `Edit manually`.

`Move to nearest available day` searches forward from the day after the full day and uses the first day with a valid slot. This search happens only after the user explicitly chooses the action.

## Time Zone Handling

The configured IANA time zone in settings is authoritative. Date boundaries, weekend detection, calendar-block queries, and generated slot timestamps use that time zone.

The implementation introduces a time-zone helper module. It converts:

- an instant into a local calendar date;
- a local date and clock time into an instant;
- a local calendar date into its next date;
- a local date into its weekday.

The helper must support daylight-saving transitions. Fixed offsets such as `+09:00` are not used for scheduling calculations.

## Idempotency

Each task stores the local date on which carryover was last processed. A reconciliation run processes only tasks whose planned local date is earlier than the user's current local date and whose last processed date is not the current date.

Repeated scheduler calls on the same local date do not increment carryover count twice, create duplicate notifications, or move a task twice.

## Reconciliation Flow

1. Read settings and derive the user's current local date.
2. Select incomplete tasks with a planned start before that local date.
3. For each missed task, inspect calendar blocks and already allocated task slots for the next local date.
4. Move the task to the earliest valid slot or mark it `needs_attention`.
5. Persist the updated task and one notification.
6. Trigger Google writeback after reconciliation so the dedicated `Focus Calendar` reflects the new task time.

The scheduler processes tasks in priority order so more urgent tasks receive available slots first.

## Execution Triggers

Reconciliation runs:

- when the dashboard opens, before refreshing the task list;
- through `POST /api/schedule/reconcile`;
- through a hosted scheduler request to the same endpoint.

Hosted scheduler requests include `Authorization: Bearer <SCHEDULER_SECRET>`. Local development may call the endpoint without the secret when `SCHEDULER_SECRET` is unset. In production, the secret is required.

The endpoint is suitable for a platform cron job running periodically, such as every 15 minutes. Idempotency ensures only one carryover per local date.

## Notifications

Carryover and conflict results are stored in the existing `Notification` model.

The dashboard shows unread notifications in an attention panel. Reading the panel marks displayed notifications as read. Browser permission requests and push delivery are deferred to the notification increment.

## Data Model Changes

- Add `lastCarryoverDate String?` to `Quest`.
- Keep using `Notification` for persisted `carried_over` and `conflict` messages.

## API And UI

- Harden `POST /api/schedule/reconcile` with optional scheduler-secret verification.
- Add an endpoint to list unread notifications and mark them as read.
- Add an endpoint for `Move to nearest available day`.
- Run reconciliation when the dashboard opens.
- Display persisted carryover and conflict notices.
- For `needs_attention`, expose nearest-day movement and manual-edit actions.

## Error Handling

- If reconciliation fails for one task, record the failure and continue processing other tasks.
- A failed task remains visible at its last known schedule.
- Google writeback failure does not undo a successful local carryover; the existing Google sync error status records the external failure and allows retry.
- An invalid scheduler secret returns `401` without changing data.

## Testing

Tests cover:

- a same-day missed task remains unchanged;
- a past-day task moves exactly once to the next-day earliest slot;
- a future task is untouched;
- repeated same-date reconciliation is idempotent;
- tasks compete for slots in priority order;
- a full next day yields `needs_attention` and one conflict notification;
- explicit nearest-day movement searches beyond the full day;
- configured IANA zones and daylight-saving date boundaries;
- valid and invalid scheduler-secret requests;
- dashboard-open reconciliation and persisted notification display.

