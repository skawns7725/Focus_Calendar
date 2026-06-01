# Calendar Details And Gesture Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add familiar calendar details, optional notes, restrained mobile swipe actions, responsive containment, and a recoverable Google OAuth return path.

**Architecture:** Extend the existing task model with one optional note field and keep creation and editing in the existing form. Add a focused swipe-actions component around cards so gesture logic remains testable. Wrap the OAuth callback with a small failure redirect while preserving its invalid-request response.

**Tech Stack:** Next.js App Router, React, TypeScript, Prisma, Vitest, Testing Library

---

### Task 1: Persist Optional Notes

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/domain/types.ts`
- Modify: `src/test/factories.ts`
- Modify: `src/server/quest-repository.ts`
- Modify: `src/server/google/google-sync-repository.ts`
- Modify: `src/server/services/quest-service.ts`
- Test: `src/server/services/quest-service.test.ts`
- Test: `src/server/google/google-sync-service.test.ts`

- [ ] Add failing tests for trimmed optional notes and Google event descriptions.
- [ ] Run the focused tests and verify the missing-note failures.
- [ ] Add `note String?`, validation, repository mapping, and Google description mapping.
- [ ] Run focused tests until green.

### Task 2: Use One Familiar Form For Create And Edit

**Files:**
- Modify: `src/components/quest-form.tsx`
- Modify: `src/components/quest-form.test.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/client/api.ts`

- [ ] Add failing component tests for familiar labels, note submission, edit defaults, save wording, and cancel.
- [ ] Run component tests and verify failures.
- [ ] Extend `QuestForm` with optional initial values and edit controls.
- [ ] Replace the ISO prompt in `Dashboard` with in-page editing.
- [ ] Run focused tests until green.

### Task 3: Add Mobile Swipe Actions

**Files:**
- Create: `src/components/swipe-actions.tsx`
- Create: `src/components/swipe-actions.test.tsx`
- Modify: `src/components/quest-card.tsx`
- Modify: `src/components/quest-list.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/app/globals.css`

- [ ] Add failing tests for left reveal, right complete, and short-drag ignore behavior.
- [ ] Run the tests and verify failures.
- [ ] Implement touch thresholds, optional haptic feedback, visible fallback buttons, and delete confirmation.
- [ ] Run focused tests until green.

### Task 4: Fix Responsive Overflow And Refine Copy

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/quest-card.tsx`
- Modify: `src/components/dashboard.tsx`
- Modify: `src/components/quest-list.tsx`

- [ ] Add or update component assertions for the refined labels.
- [ ] Apply `min-width: 0`, wrapping, and narrow-screen action sizing.
- [ ] Run focused UI tests and verify green.

### Task 5: Recover From OAuth Callback Failures

**Files:**
- Modify: `src/app/api/google/callback/route.ts`
- Modify: `src/components/settings-page.tsx`
- Test: `src/app/api/google/callback/route.test.ts`
- Test: `src/components/settings-page.test.tsx`

- [ ] Add failing tests for callback failure redirect and settings reconnect copy.
- [ ] Run focused tests and verify failures.
- [ ] Redirect runtime callback errors to `/settings?google=error`.
- [ ] Render a concise reconnect prompt on settings.
- [ ] Run focused tests until green.

### Task 6: Verify And Deploy

**Files:**
- Modify only if verification reveals a scoped defect.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Verify at 390 pixels that `document.documentElement.scrollWidth <= window.innerWidth`.
- [ ] Verify the public OAuth connect redirect and settings fallback screen.
- [ ] Commit, push, and verify the Vercel deployment.

