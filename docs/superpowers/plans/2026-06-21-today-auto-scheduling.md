# Today Auto Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard clearly show that newly entered tasks are automatically placed into today's available time.

**Architecture:** Extend the existing `Quest` model with a backward-compatible category default. Add a pure domain utility that orders incomplete, unplanned flexible tasks and places them around occupied blocks inside the user's active hours with a ten-minute buffer. The scheduling service persists those placements after task creation, while focused dashboard components render today's blocks and onboarding guidance.

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma/PostgreSQL, Vitest, Testing Library

---

### Task 1: Backward-Compatible Task Metadata

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/domain/types.ts`
- Modify: `src/server/quest-repository.ts`
- Modify: `src/server/google/google-sync-repository.ts`
- Modify: `src/server/services/quest-service.ts`
- Modify: `src/components/quest-form.tsx`
- Modify: `src/components/quest-card.tsx`
- Modify: `src/test/factories.ts`
- Test: `src/components/quest-form.test.tsx`
- Test: `src/server/services/quest-service.test.ts`

- [ ] Add failing tests proving an omitted category becomes `other` and the form submits a selected category.
- [ ] Run the focused tests and confirm failures are caused by the missing category behavior.
- [ ] Add `QuestCategory`, optional input defaults, Prisma `@default("other")`, repository fallbacks, form selection, and category display.
- [ ] Run focused tests and confirm they pass.

### Task 2: Pure Today Auto-Scheduling Utility

**Files:**
- Create: `src/domain/auto-schedule-today.ts`
- Create: `src/domain/auto-schedule-today.test.ts`

- [ ] Add failing tests for completed-task exclusion, deadline/importance ordering, expected-duration blocks, ten-minute buffers, occupied blocks, and activity-hour boundaries.
- [ ] Run the utility test and confirm it fails because the module does not exist.
- [ ] Implement `autoScheduleToday` as a deterministic pure function returning `{ questId, start, end }` placements.
- [ ] Run the utility tests and confirm they pass.

### Task 3: Persist Automatic Placement After Creation

**Files:**
- Modify: `src/server/services/scheduling-service.ts`
- Modify: `src/server/services/scheduling-service.test.ts`
- Modify: `src/app/api/quests/route.ts`

- [ ] Add a failing service test proving unplanned flexible tasks are persisted into today's free time in priority order.
- [ ] Run the service test and confirm the missing `scheduleToday` behavior fails.
- [ ] Implement `scheduleToday(now)` using settings, imported calendar blocks, existing planned tasks, and `autoScheduleToday`.
- [ ] Call `scheduleToday` after task creation and return the updated created task.
- [ ] Run service and API-adjacent tests.

### Task 4: Dashboard Focus Blocks And Empty Guidance

**Files:**
- Create: `src/components/today-focus-blocks.tsx`
- Create: `src/components/today-focus-blocks.test.tsx`
- Create: `src/components/getting-started.tsx`
- Create: `src/components/getting-started.test.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/components/dashboard.test.tsx`
- Modify: `src/app/globals.css`

- [ ] Add failing component tests for the `오늘의 집중 블록` section and the three-step empty-state guide with examples.
- [ ] Run the component tests and confirm the new UI is absent.
- [ ] Implement compact responsive blocks showing time, title, duration, and category, plus an onboarding sequence that opens the existing task modal.
- [ ] Integrate both components into the dashboard and run focused tests.

### Task 5: Verification

**Files:**
- Verify all modified files.

- [ ] Run focused domain, service, and component tests.
- [ ] Run `npm test` and distinguish pre-existing environment failures from regressions.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` and review the final diff for scope and default handling.
