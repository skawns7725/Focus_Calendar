# AGENTS.md — Focus Calendar Development Instructions

Before starting any task, read:

- Product principles: `docs/PRODUCT_PRINCIPLES.md`
- Recent review status: `docs/REVIEW_LOG.md`

## Core Rules

- Do not deploy unless explicitly requested.
- Do not commit unless explicitly requested.
- Prefer small, focused changes.
- Do not make broad refactors unless they are necessary for the requested task.
- Do not change Google Calendar sync or notification behavior unless explicitly requested.
- Preserve existing user data and backward compatibility.
- Run related tests before running the full test suite.
- Separate environment/setup failures from code regressions in the final report.
- Do not claim success for checks that were not actually run.
- Mobile layout must work at 390px width without horizontal overflow.

## Product Direction

Focus Calendar is not just a planning app. It is a rescheduling and recovery tool.

Core product sentence:

> Not an app that only helps users make plans, but an app that recalculates when plans break.

Every feature should reduce the user’s need to manually recalculate time, priorities, and next actions.

## Scheduling Rules

For scheduling, auto-scheduling, study planning, and focus block features:

- Preserve the existing auto-scheduling behavior unless the task explicitly changes it.
- Completed items must not be scheduled again.
- Already scheduled items must not be duplicated.
- Existing calendar events and Google Calendar events must not be treated as free time.
- The app should not fill 100% of the user’s available day.
- Keep realistic buffer time between blocks.
- Explain why an item was scheduled.
- Explain why an item could not be scheduled.
- Do not hide unscheduled items.
- Users must be able to edit automated results.

## Data and Migration Rules

When changing Prisma schema or data models:

- Explain why the schema change is necessary.
- Include a migration.
- Define safe defaults for existing rows.
- Check backward compatibility with existing data.
- Run `npx prisma validate`.
- Verify that existing creation and update flows still work.

## UI and UX Rules

- State changes should be reflected immediately when reasonable.
- If saving fails, the UI must recover or roll back safely.
- Empty states must explain the next available action.
- Failure states should not blame the user.
- Use short, concrete copy that explains:
  1. current state
  2. reason
  3. next action

Preferred copy style:

- “Some tasks could not be scheduled because today has limited remaining time.”
- “This task needs more time than the available slot.”
- “You can adjust the estimated time or move it to another day.”

Avoid copy such as:

- “You failed.”
- “You did not keep your plan.”
- “You lack discipline.”

## Testing Order

Use this order unless the task requires otherwise:

1. Inspect current Git state:
   - `git status`
   - `git branch --show-current`
   - `git diff --stat`
2. Run related unit tests.
3. Run related component or integration tests.
4. Run related E2E tests when UI behavior changes.
5. Run `npx prisma validate` when Prisma is affected.
6. Run `npm run build`.
7. Run `git diff --check`.
8. Run the full test suite only near commit-readiness or when explicitly requested.

## Final Report Format

At the end of a task, report:

1. What changed
2. Files changed
3. Tests added or updated
4. Checks run
5. Checks not run and why
6. Remaining risks
7. Whether the change is commit-ready
