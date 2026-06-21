# PostgreSQL Migration Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing migration chain runnable on an empty PostgreSQL database and verify StudyPlan persistence and the minimal mobile dashboard ordering without touching production data.

**Architecture:** Add a PostgreSQL baseline representing the schema immediately before the two existing delta migrations. Exercise the real Prisma repository against an explicitly opted-in disposable PostgreSQL database, and keep the UI change to a DOM-order swap guarded by a component test.

**Tech Stack:** Prisma 6, PostgreSQL, Vitest, React Testing Library, Playwright, Docker

---

### Task 1: Add the pre-delta baseline migration

**Files:**
- Create: `prisma/migrations/20260621180000_baseline/migration.sql`

- [ ] Generate PostgreSQL DDL from the committed pre-delta Prisma schema.
- [ ] Confirm it creates every pre-existing model, index, unique constraint, and Session foreign key.
- [ ] Confirm it does not create `Quest.category`, `StudyPlan`, or `StudyBlock`, and does not add defaults that belong to the first delta.

### Task 2: Add real PostgreSQL repository integration coverage

**Files:**
- Create: `src/server/study-plan-repository.integration.test.ts`

- [ ] Write integration tests for nested plan/block creation, owner-isolated listing, cross-owner completion rejection, own-owner completion persistence, completed-candidate exclusion, and database cascade deletion.
- [ ] Run the test before the disposable database is migrated and confirm it fails for the expected missing-table reason.
- [ ] Apply all migrations to the disposable database.
- [ ] Re-run the integration test and confirm it passes.

### Task 3: Move the now panel before Study Plan Scheduler

**Files:**
- Modify: `src/components/dashboard.test.tsx`
- Modify: `src/components/dashboard.tsx`

- [ ] Add an assertion that the now panel precedes Study Plan Scheduler in document order.
- [ ] Run the dashboard test and confirm the new assertion fails.
- [ ] Swap only the two dashboard render positions.
- [ ] Re-run the dashboard test and confirm it passes.

### Task 4: Verify the migration chain on disposable PostgreSQL

**Files:**
- No repository changes.

- [ ] Start a disposable PostgreSQL container on port 54329.
- [ ] Inject `DATABASE_URL` only into each command process.
- [ ] Run `npx prisma validate`, `npx prisma migrate status`, and `npx prisma migrate deploy`.
- [ ] Inspect applied migrations and verify the final database schema matches `prisma/schema.prisma`.
- [ ] Confirm migration SQL performs only schema/default/backfill changes already represented in the deltas.

### Task 5: Run focused and release-readiness checks

**Files:**
- No repository changes unless a verified regression requires a focused fix.

- [ ] Run StudyPlan domain, service, repository integration, component, dashboard, today-focus, scheduling, unplaced-reason, and Google repository/sync tests.
- [ ] Run the 390px mobile E2E test.
- [ ] Run `npm run build` with the disposable PostgreSQL URL in process scope.
- [ ] Run `git diff --check`.
- [ ] Review final Git status and report checks not run, environmental failures, risks, and commit readiness without committing or deploying.
