# Focus Calendar Themes And Google Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace game-like UI language with ordinary productivity language, add persisted light/dark/system themes with light as the first-visit default, and prepare Google OAuth plus optional dedicated-calendar two-way synchronization.

**Architecture:** Keep the existing internal `Quest` domain naming to avoid a broad migration. Add user-facing text changes in components, persist theme and sync preferences in settings, and isolate Google integration behind a provider interface. Default calendar access remains read-only; write authorization is incremental and only used for app-owned events in the dedicated `Focus Calendar`.

**Tech Stack:** Next.js, React, TypeScript, Prisma SQLite, Zod, Vitest, Testing Library, Playwright, Google OAuth 2.0, Google Calendar API

---

## Task 1: Update User-Facing Language And Themes

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/server/settings-repository.ts`
- Modify: `src/server/services/settings-service.ts`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/components/quest-card.tsx`
- Modify: `src/components/quest-list.tsx`
- Modify: `src/components/quest-form.tsx`
- Modify: `src/components/settings-page.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/theme-controller.tsx`
- Create: `src/components/theme-controller.test.tsx`

- [ ] Write a failing test that verifies first visit uses `light`, stored `dark` is restored, and `system` listens to `prefers-color-scheme`.
- [ ] Add `theme` setting with values `light | dark | system`, defaulting to `light`.
- [ ] Apply the selected effective theme to `document.documentElement.dataset.theme`.
- [ ] Replace game-like visible copy with ordinary schedule and task language.
- [ ] Rework CSS variables so light is the default and dark uses `[data-theme="dark"]`.
- [ ] Run `npm test` and `npm run build`.
- [ ] Commit with `feat: add focus calendar themes and neutral copy`.

## Task 2: Add Google OAuth And Dedicated Calendar Contracts

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `src/server/google/google-scopes.ts`
- Create: `src/server/google/google-auth.ts`
- Create: `src/server/google/google-calendar-client.ts`
- Create: `src/server/google/google-calendar-client.test.ts`
- Create: `src/server/google/google-sync-service.ts`
- Create: `src/app/api/google/connect/route.ts`
- Create: `src/app/api/google/callback/route.ts`
- Create: `src/app/api/google/sync/route.ts`
- Create: `src/app/api/google/two-way-sync/route.ts`
- Modify: `src/components/settings-page.tsx`
- Modify: `.env.example`

- [ ] Write failing tests for read-only scopes, incremental write scopes, and dedicated `Focus Calendar` selection.
- [ ] Add environment-based OAuth URL generation.
- [ ] Store Google connection state, dedicated calendar ID, and task-to-event mappings.
- [ ] Add read-only sync route.
- [ ] Add explicit two-way sync opt-in route that requests incremental write authorization.
- [ ] Restrict write operations to the dedicated `Focus Calendar`.
- [ ] Show Google connection and synchronization controls in settings.
- [ ] Run `npm test`, `npm run test:e2e`, and `npm run build`.
- [ ] Commit with `feat: prepare google calendar oauth and dedicated sync`.

## Task 3: Configure Google Cloud Console

**External State:**
- Google Cloud Console project: `Focus Calendar`
- API: Google Calendar API
- OAuth client type: Web application

- [ ] Create the Google Cloud project.
- [ ] Enable Google Calendar API.
- [ ] Configure OAuth consent screen.
- [ ] Create a web OAuth client with local callback URI:
  `http://localhost:3000/api/google/callback`
- [ ] Place client ID and secret in local `.env`.
- [ ] Start the app and verify Google connection.

## Validation

- [ ] First visit uses light theme.
- [ ] Light, dark, and system choices persist.
- [ ] Visible app text uses `할 일`, `오늘 일정`, and ordinary calendar language.
- [ ] Read-only connect requests no write scope.
- [ ] Two-way opt-in requests write scope only after explicit user action.
- [ ] App writes only to the dedicated `Focus Calendar`.
- [ ] `npm audit --omit=dev`, `npm test`, `npm run test:e2e`, and `npm run build` pass.
