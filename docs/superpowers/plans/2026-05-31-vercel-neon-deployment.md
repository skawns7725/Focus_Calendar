# Vercel And Neon Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare Focus Calendar for a free Vercel Hobby deployment backed by Neon PostgreSQL.

**Architecture:** Use one PostgreSQL Prisma datasource in every environment. Let Vercel provision Neon through Marketplace environment variables and run a Vercel-specific build command that applies the Prisma schema before compiling Next.js.

**Tech Stack:** Next.js, Prisma, PostgreSQL, Vercel Hobby, Neon PostgreSQL, cron-job.org

---

### Task 1: Switch Prisma To PostgreSQL

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `.env.example`

- [ ] **Step 1: Replace the SQLite datasource**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- [ ] **Step 2: Document a PostgreSQL connection string**

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

- [ ] **Step 3: Generate the Prisma client**

Run: `npm run db:generate`

Expected: Prisma Client generation succeeds.

### Task 2: Add The Vercel Build Command

**Files:**
- Modify: `package.json`
- Modify: `Dockerfile`

- [ ] **Step 1: Generate Prisma during normal builds**

```json
"build": "prisma generate && next build"
```

- [ ] **Step 2: Add a Vercel-specific schema application step**

```json
"vercel-build": "prisma generate && prisma db push && next build"
```

- [ ] **Step 3: Remove the duplicate Docker generation command**

```dockerfile
RUN npm run build
```

### Task 3: Update Deployment Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Explain PostgreSQL local setup**

- [ ] **Step 2: Replace the SQLite container volume guidance with an external PostgreSQL connection**

- [ ] **Step 3: Add the Vercel Hobby, Neon Marketplace, Google OAuth, and cron-job.org setup sequence**

### Task 4: Verify The Repository

- [ ] **Step 1: Generate the Prisma client**

Run: `npm run db:generate`

Expected: Prisma Client generation succeeds.

- [ ] **Step 2: Run unit tests**

Run: `npm test`

Expected: all unit tests pass.

- [ ] **Step 3: Build the application**

Run: `npm run build`

Expected: the production Next.js build succeeds without requiring a live database.

- [ ] **Step 4: Check whitespace**

Run: `git diff --check`

Expected: no output.
