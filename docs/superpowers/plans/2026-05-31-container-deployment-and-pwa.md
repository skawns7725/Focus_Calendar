# Container Deployment And PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent single-container deployment and mobile home-screen manifest.

**Architecture:** Next.js runs from a Docker container with `/data` mounted for SQLite. The image initializes Prisma before serving. A manifest metadata route lets mobile browsers install the responsive site as a shortcut.

**Tech Stack:** Docker, Next.js standalone output, Prisma SQLite, Web App Manifest

---

### Task 1: Add Mobile Manifest

**Files:** Create `src/app/manifest.ts`; modify `src/app/layout.tsx`

- [ ] Add a manifest returning `name`, `short_name`, `start_url`, `display: "standalone"`, and theme colors.
- [ ] Add root layout metadata for the manifest and application name.
- [ ] Run `npm run build` and verify `/manifest.webmanifest` appears.

### Task 2: Add Container Runtime

**Files:** Create `Dockerfile`, `.dockerignore`, `docker-entrypoint.sh`; modify `next.config.ts`

- [ ] Enable `output: "standalone"`.
- [ ] Build dependencies and the Next app in a multi-stage image.
- [ ] Copy Prisma schema, generated client, static files, and public assets into the runtime image.
- [ ] Run `npx prisma db push` before `node server.js`.
- [ ] Build with `docker build -t focus-calendar .`.

### Task 3: Document Production Operation

**Files:** Modify `README.md`, `.env.example`

- [ ] Document `/data` volume mounting, one replica, HTTPS, OAuth callback URL, VAPID variables, and scheduler calls.
- [ ] Run `npm run db:push`, `npm test`, `npm run build`, `npm run test:e2e`, and `git diff --check`.
- [ ] Commit with `feat: add container deployment and pwa manifest`.
