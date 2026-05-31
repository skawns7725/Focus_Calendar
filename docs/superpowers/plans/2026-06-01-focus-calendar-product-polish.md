# Focus Calendar Product Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Focus Calendar into a calm, distinctive priority guide with a real calendar view and a clear single next action.

**Architecture:** Add small focused presentation components around the existing priority and API layers. Extend the calendar API with a read endpoint, then let the client combine imported calendar blocks and scheduled quests without changing scheduling rules.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Vitest, Testing Library

---

### Task 1: Route-Aware Navigation

**Files:**
- Create: `src/components/app-navigation.tsx`
- Create: `src/components/app-navigation.test.tsx`
- Modify: `src/components/app-shell.tsx`

- [ ] Write a failing test proving `/settings` highlights settings instead of the list.
- [ ] Run `npm test -- src/components/app-navigation.test.tsx` and verify the missing component failure.
- [ ] Add a client navigation component using `usePathname()` and the shared SVG icons.
- [ ] Run the focused test and verify it passes.

### Task 2: Now Panel

**Files:**
- Create: `src/components/now-panel.tsx`
- Create: `src/components/now-panel.test.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/app/globals.css`

- [ ] Write failing tests proving the first sorted task appears and the empty state offers task creation.
- [ ] Run `npm test -- src/components/now-panel.test.tsx` and verify the missing component failure.
- [ ] Implement the panel and connect its completion and add-task actions.
- [ ] Run the focused test and verify it passes.

### Task 3: Real Calendar Blocks

**Files:**
- Modify: `src/app/api/calendar/import/route.ts`
- Modify: `src/client/api.ts`
- Modify: `src/components/calendar-page.tsx`
- Create: `src/components/calendar-page.test.tsx`
- Modify: `src/app/globals.css`

- [ ] Write a failing test proving imported calendar blocks and scheduled quests appear without demo entries.
- [ ] Run `npm test -- src/components/calendar-page.test.tsx` and verify the demo-data failure.
- [ ] Add a calendar read endpoint, client function, and client-side range loader.
- [ ] Run the focused test and verify it passes.

### Task 4: Product Finish And Verification

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/manifest.ts`

- [ ] Tune the monochrome styles for the new panel, calendar states, and mobile layout.
- [ ] Run focused component tests.
- [ ] Run `git diff --check`.
- [ ] Run `npm test`, documenting the known local PostgreSQL URL mismatch if it remains.
- [ ] Run `npm run build`.
- [ ] Align repository-local Git author metadata to the connected GitHub identity, commit, push, and verify the free Vercel deployment.
