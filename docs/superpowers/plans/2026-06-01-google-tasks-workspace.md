# Google Tasks-Style Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect list, calendar, and notification workflows through one modal task editor and a shared notification center.

**Architecture:** Keep server APIs small and reuse existing quest endpoints. Add `TaskModal` as a presentation wrapper around `QuestForm`, make `CalendarGrid` expose Focus Calendar task selection, and mount `NotificationCenter` inside `AppShell`. Persist an optional repeat rule through the existing quest model.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Vitest, Testing Library

---

### Task 1: Persist Repeat Selection

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/server/quest-repository.ts`
- Modify: `src/server/services/quest-service.ts`
- Modify: `src/components/quest-form.tsx`
- Test: `src/server/services/quest-service.test.ts`
- Test: `src/components/quest-form.test.tsx`

- [ ] Write failing tests that submit and persist `recurrenceRule: { frequency: "weekdays" }`.
- [ ] Run `npm test -- src/server/services/quest-service.test.ts src/components/quest-form.test.tsx` and confirm the new assertions fail.
- [ ] Add optional recurrence rule validation, Prisma JSON serialization, repository deserialization, and a repeat select with none, daily, weekdays, and weekly options.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Shared Modal Task Editor

**Files:**
- Create: `src/components/task-modal.tsx`
- Create: `src/components/task-modal.test.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/app/globals.css`

- [ ] Write failing dialog tests for title, close button, Cancel, and backdrop behavior.
- [ ] Run `npm test -- src/components/task-modal.test.tsx` and confirm the component is missing.
- [ ] Implement an accessible modal wrapper around `QuestForm`.
- [ ] Replace the inline dashboard form panel with `TaskModal`.
- [ ] Run modal and dashboard tests.

### Task 3: Calendar Create And Edit Flow

**Files:**
- Modify: `src/components/calendar-grid.tsx`
- Modify: `src/components/calendar-page.tsx`
- Modify: `src/components/calendar-page.test.tsx`

- [ ] Write failing tests that open add mode from the calendar and edit mode by selecting a Focus Calendar task.
- [ ] Run `npm test -- src/components/calendar-page.test.tsx` and confirm failures.
- [ ] Add an optional `onSelectTask` callback to `CalendarGrid`, shared modal state to `CalendarPage`, and immediate refresh after create or update.
- [ ] Keep imported Google Calendar blocks read-only.
- [ ] Run calendar tests.

### Task 4: Shared Notification Center

**Files:**
- Create: `src/components/notification-center.tsx`
- Create: `src/components/notification-center.test.tsx`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/app/globals.css`

- [ ] Write failing tests for unread count, panel open, and mark-read confirmation.
- [ ] Run `npm test -- src/components/notification-center.test.tsx` and confirm the component is missing.
- [ ] Implement a compact bell button and unread panel using existing notification APIs.
- [ ] Mount it in `AppShell` beside account status.
- [ ] Run notification and shell tests.

### Task 5: Verify And Deploy

**Files:**
- Modify only if verification reveals a regression.

- [ ] Run focused component and service tests.
- [ ] Run `git diff --check`.
- [ ] Run `npm run build`.
- [ ] Commit the implementation.
- [ ] Push the branch and fast-forward `main`.
- [ ] Verify the deployed root, list modal, day calendar modal, mobile overflow, and recent Vercel 500 logs.
