# Quest Calendar Web App Design

## 1. Purpose

This web app helps users decide what to do first when they have difficulty prioritizing tasks. It combines a read-only view of Google Calendar with an internal quest system. The primary experience is a prioritized quest list, not calendar editing.

The app should reduce decision-making overhead:

- Show the most urgent unfinished work at the top.
- Place flexible quests into available time automatically.
- Keep unfinished quests visible instead of repeatedly moving them during the same day.
- Carry unfinished quests forward on the next day when possible.
- Ask the user to resolve conflicts when there is not enough available time.

## 2. MVP Scope

### Included

- Google account login
- Shared server-side account data across devices
- Read-only Google Calendar import
- Google Calendar read-only OAuth scope only
- Fixed calendar blocks derived from imported events
- Optional conversion of an imported event into a quest
- Prioritized quest list as the default home screen
- Daily and weekly calendar views
- Configurable default view: list, daily calendar, or weekly calendar
- Flexible and fixed-time quests
- Automatic internal placement of flexible quests
- Daily carryover of incomplete quests
- Conflict warnings and rescheduling suggestions
- Recurring quests
- In-app notifications and browser notifications when permission is granted
- Desktop web UI and mobile-specific web UI served from the same URL
- Brief completion animation and today's completed quest count

### Excluded

- Writing quest changes back to Google Calendar
- Native mobile apps and app store distribution
- Automatic splitting of a long quest into multiple sessions
- Levels, rewards, character growth, and achievement systems
- Fully autonomous conflict resolution when user judgment is required

## 3. Product Principles

1. The user should see what deserves attention first without manually comparing tasks.
2. Missed work should remain visible and actionable.
3. Automatic behavior should save effort without hiding important decisions.
4. Calendar integration should provide context, while quest state remains owned by this app.
5. Completion should feel satisfying but visually restrained.

## 4. Quest Model

### 4.1 Quest Types

#### Flexible Quest

The user enters:

- Title
- Deadline
- Expected duration
- Importance
- Optional recurrence rule

The app places the quest into an available internal time slot before the deadline.

#### Fixed-Time Quest

The user enters:

- Title
- Planned execution time
- Deadline
- Expected duration if it is not implied by the planned time range
- Importance
- Optional recurrence rule

The app respects the planned execution time unless the user edits it or a later carryover requires rescheduling.

An imported Google Calendar event is a fixed calendar block by default. If the user converts it into a quest, it becomes a fixed-time quest while the imported event remains read-only.

### 4.2 Quest Statuses

- `scheduled`: assigned to an internal time slot
- `due_today`: planned time has passed today but the quest remains incomplete
- `completed`: explicitly completed by the user
- `needs_attention`: automatic placement is impossible without user input
- `overdue`: deadline has passed while incomplete
- `abandoned`: explicitly abandoned by the user

### 4.3 Priority Order

The list uses a deterministic hierarchical ordering:

1. Earlier deadline
2. Higher user-defined importance
3. Higher carryover count

Overdue quests appear before non-overdue quests regardless of this normal ordering.

## 5. Scheduling Rules

### 5.1 Available Time

Users configure activity hours separately for weekdays and weekends. The scheduler considers only time inside these activity hours.

Imported Google Calendar events are read-only fixed blocks. The scheduler removes these blocks from the available time before placing quests.

All scheduling, deadline, and date-boundary calculations use the user's configured time zone.

### 5.2 Initial Placement

- Flexible quests are placed into the earliest sufficiently long available slot before their deadline.
- Each quest remains a single completion unit. The app does not split a long quest into multiple sessions.
- Fixed-time quests retain the user-selected time unless explicitly changed.
- Placement is stored only inside this app and is never written to Google Calendar in the MVP.

### 5.3 Same-Day Missed Quests

When a quest's planned time passes without completion:

- It remains visible in today's prioritized list.
- Its status changes to `due_today`.
- The app does not repeatedly move it to later hours during the same day.

### 5.4 Next-Day Carryover

After the date changes in the user's configured time zone, an incomplete quest is eligible for carryover:

- If the next day has a sufficiently long available slot, the app moves the quest to that slot internally.
- The carryover count increments.
- The app informs the user that the quest has moved.

### 5.5 Insufficient Capacity

If the next day has no sufficiently long slot:

- The app sets the quest to `needs_attention`.
- It explains that the next day is full.
- It shows the nearest date with an available slot.
- It suggests lower-priority quests that could be moved to create room before the deadline.
- The user chooses whether to accept a suggested move or edit the schedule manually.

The app does not automatically move the quest to a later date without user confirmation in this case.

### 5.6 Overdue Quests

When the deadline passes, the quest moves to the top of the list with an overdue indicator. The user must choose one of:

- Complete
- Set a new deadline
- Abandon

## 6. Recurring Quests

The MVP supports:

- Daily recurrence
- Weekday recurrence
- Selected weekdays
- Weekly recurrence

Each occurrence is an independent quest instance. An incomplete earlier occurrence does not merge with the next one and does not disappear when a later instance is generated.

## 7. User Interface

### 7.1 Shared Navigation

The app provides:

- Priority list
- Daily calendar
- Weekly calendar
- Quest creation and editing
- Notifications
- Settings

Users can choose the default starting view in settings. The default for new accounts is the priority list.

### 7.2 Desktop Web

The desktop UI uses the wider screen for:

- A dense prioritized list
- Quest details in a secondary panel
- Easy switching between list, daily calendar, and weekly calendar
- Conflict review with rescheduling suggestions

Each list item shows:

- Title
- Planned time
- Deadline
- Importance
- Carryover count
- Recurrence indicator
- Current status
- Completion action

### 7.3 Mobile Web

Mobile users visit the same URL and receive a mobile-specific layout based on viewport size. The site can be added as a home-screen shortcut.

The mobile UI prioritizes:

- One-handed list browsing
- Bottom navigation
- Large touch targets
- A prominent slide-to-complete interaction
- A concise quest creation flow

Desktop and mobile views use the same account data and server APIs.

### 7.4 Completion Feedback

Completion produces:

- A brief restrained animation
- An updated count of quests completed today

The MVP intentionally excludes extensive game mechanics.

## 8. Notifications

The MVP sends only essential notifications:

- Quest planned start time
- Deadline approaching
- Quest moved to the next day
- Conflict requiring user judgment

In-app notifications are always available. Browser notifications are sent only after the user grants permission.

## 9. Components and Responsibilities

### Authentication

- Google login
- User session management
- Account-scoped data access
- Request the Google Calendar read-only OAuth scope and no calendar write scope

### Calendar Synchronization

- Read Google Calendar events
- Import recurring events
- Store the last successful synchronization time
- Preserve the last imported data if synchronization fails

### Quest Management

- Create, edit, complete, abandon, and reschedule quests
- Convert imported calendar events into quests
- Generate recurring quest instances

### Scheduling Engine

- Calculate available time from activity hours and fixed blocks
- Place flexible quests
- Carry incomplete quests forward at the date boundary
- Detect insufficient capacity
- Generate conflict resolution suggestions

### Priority Engine

- Produce a deterministic ordered list using deadline, importance, and carryover count
- Place overdue quests first

### Notification Service

- Generate in-app notifications
- Send browser notifications when allowed

### Web Clients

- Render desktop-specific and mobile-specific experiences
- Consume the same server APIs and account data

## 10. Data Flow

1. The user signs in with Google.
2. The server reads Google Calendar events and stores a synchronized read-only representation.
3. The scheduling engine subtracts imported fixed blocks from user-configured activity hours.
4. The user creates quests or converts selected imported events into quests.
5. The scheduler assigns internal time slots to flexible quests.
6. The priority engine returns an ordered quest list to desktop and mobile clients.
7. At the date boundary, the server processes incomplete quests for carryover.
8. Successful carryovers generate notifications. Capacity conflicts generate `needs_attention` items and suggestions.

## 11. Error Handling

- If Google Calendar synchronization fails, retain previously synchronized blocks and show the last successful synchronization time.
- If a quest cannot be placed before its deadline, mark it as `needs_attention` and explain why.
- Never delete, hide, merge, or silently move an incomplete quest when user judgment is required.
- Reject invalid quest input, such as a deadline before the planned execution time.
- Show notification permission failures without blocking normal app usage.

## 12. Validation Criteria

The MVP is acceptable when:

1. Quests sort correctly by deadline, importance, and carryover count.
2. Overdue quests always appear above non-overdue quests.
3. Flexible quests avoid imported Google Calendar blocks and remain inside configured activity hours.
4. A missed quest remains visible for the rest of the day without repeated same-day rescheduling.
5. A missed quest moves to the next day only when a sufficiently long slot exists.
6. If the next day is full, the app requests user input and offers the nearest date and lower-priority move candidates.
7. Recurring quest instances remain independent.
8. Desktop and mobile-specific layouts show the same account data.
9. Google Calendar synchronization failure preserves the last valid imported schedule.
10. Notifications are created for starts, approaching deadlines, successful carryovers, and conflicts.

## 13. Implementation Boundary

This specification covers one MVP implementation cycle. Later iterations may add Google Calendar write-back, richer rescheduling controls, multi-session quests, native mobile apps, or additional game mechanics, but these are outside the initial implementation plan.

## 14. Approved Product Revision

This revision supersedes earlier UI wording, theme, and Google Calendar write-back exclusions. Internal code may continue using the existing `quest` domain name to avoid unnecessary migration risk, but user-facing language must use ordinary productivity-app terminology.

### 14.1 Product Name And User-Facing Language

- Product name: `Focus Calendar`
- `Quest Calendar` becomes `Focus Calendar`
- `quest` becomes `task` or `to-do item` in user-facing copy
- `Today's mission` becomes `Today's schedule`
- `Priority Queue` becomes `Priority list`
- `Focus mode: deadline priority` becomes `Sort order: deadline first`
- Completion feedback remains brief and restrained
- Game-like terminology, dramatic tone, and HUD-like phrasing are removed

### 14.2 Theme

The app supports three theme choices:

- `light`: default for new users and first visit
- `dark`: lower-glare option for dark environments
- `system`: follows the device preference only after the user explicitly selects it

The light theme uses white and neutral gray surfaces with a restrained green accent. The dark theme keeps comfortable low-light contrast while softening the current high-intensity game-like styling. The selected theme persists across visits.

### 14.3 Google Calendar Authorization

Google Calendar integration has two explicit modes:

#### Default Read-Only Mode

- Request calendar read authorization.
- Import events as fixed blocks.
- Do not write to any Google calendar.
- The app remains useful when the user declines write authorization.

#### Optional Two-Way Synchronization

- Expose a setting named `Google Calendar two-way sync`.
- Request incremental calendar write authorization only after the user enables this setting.
- Create or locate a dedicated secondary calendar named `Focus Calendar`.
- Write, update, and remove only app-owned task events inside that dedicated calendar.
- Never modify the user's primary calendar or unrelated calendars.
- Store a stable mapping between internal task IDs and Google event IDs.
- If write authorization is revoked or synchronization fails, preserve internal task state and fall back to read-only behavior with a visible warning.

### 14.4 Additional Validation Criteria

11. A first visit renders in light theme.
12. The user can choose light, dark, or system theme and the choice persists.
13. User-facing screens contain no game-like task terminology.
14. Read-only Google Calendar import works without write authorization.
15. Enabling two-way synchronization requests incremental write authorization.
16. Two-way writes affect only the dedicated `Focus Calendar` calendar.
17. Revoked write authorization does not remove or corrupt internal tasks.
