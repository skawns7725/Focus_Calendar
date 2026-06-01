# Google Tasks-Style Workspace Design

## Goal

Make Focus Calendar feel like one connected workspace: capture a task once, then manage the same item from the prioritized list, day calendar, week calendar, and notification center.

## Product Direction

Google Tasks is the behavioral reference. The app keeps its distinguishing deadline-first prioritization and automatic carryover, while adopting familiar task-management patterns:

- list-first home screen;
- quick task creation from every primary view;
- optional details instead of an always-heavy form;
- due date, time, repeat, note, location, and importance fields;
- dated tasks visible in calendars;
- one edit surface regardless of where a task was opened;
- quiet, persistent notifications that can be reviewed and dismissed.

## Interaction Model

### Shared Task Modal

`TaskModal` is the only create and edit surface. It opens above the current page, traps the visual focus with a dim backdrop, closes from Cancel, the close button, or backdrop click, and uses `role="dialog"` with an accessible label.

The primary fields are title and deadline. Additional fields remain available in the same compact form: automatic or fixed-time scheduling, expected duration, importance, repeat, location, and note.

### List View

The home view remains the main working surface. It shows the next recommended task, unread scheduling notices, and the prioritized list. Creating or editing a task uses `TaskModal`, so opening details never pushes the list down the page.

### Calendar Views

Day and week calendars show imported Google Calendar blocks and Focus Calendar tasks together. A shared Add Task button opens `TaskModal`. Selecting a Focus Calendar task opens edit mode. Imported Google Calendar blocks remain read-only.

After create or edit, the calendar refreshes immediately. The list and calendar therefore represent the same task data rather than separate workflows.

### Notification Center

`NotificationCenter` lives in `AppShell`, making unread notices available from list, day, week, and settings screens. A bell button displays an unread count. Opening the panel shows recent unread scheduling notices and marks them read only after the user confirms.

The existing first-visit browser-notification preference stays in place. Browser push and in-app notices remain separate: browser push catches attention outside the app, while the in-app center provides a durable review surface.

## Repeat Setting

The form stores one optional repeat rule:

- none;
- daily;
- weekdays;
- weekly.

This increment persists and displays the selected rule. Automatic generation of future occurrences is a follow-up because it needs a dedicated completion and carryover policy for repeating tasks.

## Boundaries

This increment does not add shared lists, assignees, or subtasks. Those require additional data ownership and recurrence rules. The modal and card structure are designed so list selection and subtasks can be added later without replacing the interaction model.

## Error Handling

- Failed create and update requests remain visible inside the modal.
- Calendar sync failures show saved data with a non-blocking notice.
- Notification loading failures leave the main page usable.
- Imported Google Calendar events never open an editable Focus Calendar modal.

## Verification

- Component tests cover modal open and close behavior, calendar task selection, calendar task creation, and notification-center unread review.
- Quest service tests cover persisted repeat rules.
- Existing gesture, sync, settings, and dashboard tests continue to pass.
- Production build and deployed mobile browser checks verify layout, navigation, and dialog presentation.
