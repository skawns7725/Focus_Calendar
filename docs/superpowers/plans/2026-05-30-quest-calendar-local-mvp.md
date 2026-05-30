# Quest Calendar Local MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a locally runnable quest-calendar web MVP with desktop and mobile layouts, deterministic priorities, internal scheduling, daily carryover, conflict handling, recurring quests, and a replaceable read-only calendar adapter.

**Architecture:** Use a single Next.js App Router project with route handlers for server APIs and React components for the web clients. Keep scheduling, priority, recurrence, and carryover logic in framework-independent TypeScript modules so they can be tested directly. Persist local MVP data through Prisma and SQLite; represent Google Calendar behind a read-only adapter interface so OAuth integration can be added in a follow-up plan without changing the scheduling engine.

**Tech Stack:** Next.js, React, TypeScript, Prisma with SQLite, Zod, Vitest, Testing Library, Playwright

---

## Scope Boundary

This is the first implementation cycle from the approved design. It produces a working local product slice and intentionally defers:

- Real Google OAuth login
- Real Google Calendar API calls
- Multi-user production authentication
- Background job hosting
- Push delivery while every browser tab is closed
- Production database deployment

The local MVP still includes interfaces and API boundaries for calendar import, notifications, and date-boundary carryover so these follow-up integrations do not require rewriting the core.

## File Map

### Project Setup

- `package.json`: scripts and dependencies
- `tsconfig.json`: TypeScript configuration
- `vitest.config.ts`: unit test configuration
- `playwright.config.ts`: browser test configuration
- `prisma/schema.prisma`: SQLite persistence schema
- `.env.example`: local database configuration
- `src/test/setup.ts`: Testing Library matcher setup
- `src/test/factories.ts`: deterministic quest fixtures

### Domain

- `src/domain/types.ts`: shared domain types
- `src/domain/priority.ts`: deterministic quest sorting
- `src/domain/scheduling.ts`: slot calculation and placement
- `src/domain/carryover.ts`: same-day missed state and next-day movement
- `src/domain/recurrence.ts`: independent recurring quest instance generation
- `src/domain/notifications.ts`: essential notification creation

### Server

- `src/server/db.ts`: Prisma client
- `src/server/quest-repository.ts`: quest persistence boundary
- `src/server/settings-repository.ts`: activity-hour persistence boundary
- `src/server/calendar/calendar-source.ts`: read-only calendar interface
- `src/server/calendar/local-calendar-source.ts`: local fixed-block adapter
- `src/server/calendar/import-calendar.ts`: import orchestration
- `src/server/services/quest-service.ts`: quest CRUD orchestration
- `src/server/services/scheduling-service.ts`: scheduling and carryover orchestration
- `src/server/services/index.ts`: configured service exports for API routes

### API Routes

- `src/app/api/quests/route.ts`: list and create quests
- `src/app/api/quests/[id]/route.ts`: update a quest
- `src/app/api/quests/[id]/complete/route.ts`: complete a quest
- `src/app/api/quests/[id]/abandon/route.ts`: abandon a quest
- `src/app/api/schedule/reconcile/route.ts`: reconcile missed work and carryover
- `src/app/api/settings/route.ts`: activity hour settings
- `src/app/api/calendar/import/route.ts`: read-only calendar import

### UI

- `src/app/layout.tsx`: application shell
- `src/app/page.tsx`: default priority-list page
- `src/app/calendar/day/page.tsx`: daily calendar page
- `src/app/calendar/week/page.tsx`: weekly calendar page
- `src/app/settings/page.tsx`: settings page
- `src/components/app-shell.tsx`: desktop and mobile navigation
- `src/components/quest-list.tsx`: ordered quest list
- `src/components/quest-card.tsx`: desktop and mobile quest actions
- `src/components/quest-form.tsx`: quest creation form
- `src/components/slide-to-complete.tsx`: mobile completion interaction
- `src/components/calendar-grid.tsx`: daily and weekly schedule visualization
- `src/components/attention-panel.tsx`: conflict resolution prompt
- `src/components/completion-toast.tsx`: restrained completion feedback

### Tests

- `src/domain/*.test.ts`: direct domain behavior tests
- `src/server/services/*.test.ts`: orchestration tests
- `src/components/*.test.tsx`: component tests
- `e2e/quest-flow.spec.ts`: desktop browser flow
- `e2e/mobile-flow.spec.ts`: mobile viewport flow

## Task 1: Scaffold The Next.js Test Harness

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `.env.example`
- Create: `src/test/setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Create the project manifest**

```json
{
  "name": "quest-calendar",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "@prisma/client": "^6.8.2",
    "next": "^15.3.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zod": "^3.25.23"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/node": "^22.15.21",
    "@types/react": "^19.1.4",
    "@types/react-dom": "^19.1.5",
    "jsdom": "^26.1.0",
    "prisma": "^6.8.2",
    "typescript": "^5.8.3",
    "vitest": "^3.1.4"
  }
}
```

- [ ] **Step 2: Add TypeScript and test configuration**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "jsdom", setupFiles: ["./src/test/setup.ts"] },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Add the minimal application shell**

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
```

```tsx
// src/app/page.tsx
export default function HomePage() {
  return <main><h1>Quest Calendar</h1></main>;
}
```

- [ ] **Step 4: Install dependencies and verify the shell**

Run: `npm install`

Run: `npm test`

Expected: Vitest exits successfully with no failing tests.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json next.config.ts vitest.config.ts playwright.config.ts .env.example src
git commit -m "chore: scaffold quest calendar web app"
```

## Task 2: Define The Domain Model And Priority Rules

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/priority.ts`
- Create: `src/domain/priority.test.ts`
- Create: `src/test/factories.ts`

- [ ] **Step 1: Write failing priority tests**

```ts
import { describe, expect, it } from "vitest";
import { sortQuests } from "./priority";
import { quest } from "../test/factories";

describe("sortQuests", () => {
  it("orders quests by deadline, importance, then carryover count", () => {
    const result = sortQuests([
      quest({ id: "late", deadline: "2026-06-02T09:00:00+09:00", importance: 3 }),
      quest({ id: "low", deadline: "2026-06-01T09:00:00+09:00", importance: 1 }),
      quest({ id: "carried", deadline: "2026-06-01T09:00:00+09:00", importance: 3, carryoverCount: 2 }),
      quest({ id: "important", deadline: "2026-06-01T09:00:00+09:00", importance: 3, carryoverCount: 0 })
    ]);
    expect(result.map((item) => item.id)).toEqual(["carried", "important", "low", "late"]);
  });

  it("always places overdue quests before active quests", () => {
    const now = new Date("2026-06-01T10:00:00+09:00");
    const result = sortQuests([
      quest({ id: "active", deadline: "2026-06-01T11:00:00+09:00" }),
      quest({ id: "overdue", deadline: "2026-06-01T09:00:00+09:00" })
    ], now);
    expect(result.map((item) => item.id)).toEqual(["overdue", "active"]);
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/domain/priority.test.ts`

Expected: FAIL because `sortQuests` and the quest factory do not exist.

- [ ] **Step 3: Implement domain types, factory, and sorter**

```ts
// src/domain/types.ts
export type QuestStatus = "scheduled" | "due_today" | "completed" | "needs_attention" | "overdue" | "abandoned";
export type QuestKind = "flexible" | "fixed";

export interface Quest {
  id: string;
  title: string;
  kind: QuestKind;
  deadline: string;
  expectedMinutes: number;
  plannedStart: string | null;
  importance: 1 | 2 | 3;
  carryoverCount: number;
  status: QuestStatus;
}
```

```ts
// src/domain/priority.ts
import { Quest } from "./types";

export function sortQuests(quests: Quest[], now = new Date()): Quest[] {
  return [...quests].sort((a, b) => {
    const overdueDifference = Number(new Date(b.deadline) < now) - Number(new Date(a.deadline) < now);
    return overdueDifference
      || new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      || b.importance - a.importance
      || b.carryoverCount - a.carryoverCount;
  });
}
```

```ts
// src/test/factories.ts
import { Quest } from "@/domain/types";

export function quest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "quest-id",
    title: "Sample quest",
    kind: "flexible",
    deadline: "2026-06-02T18:00:00+09:00",
    expectedMinutes: 60,
    plannedStart: "2026-06-01T09:00:00+09:00",
    importance: 1,
    carryoverCount: 0,
    status: "scheduled",
    ...overrides
  };
}
```

- [ ] **Step 4: Run the test and verify pass**

Run: `npm test -- src/domain/priority.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain src/test
git commit -m "feat: add quest domain and priority ordering"
```

## Task 3: Calculate Available Slots And Place Flexible Quests

**Files:**
- Create: `src/domain/scheduling.ts`
- Create: `src/domain/scheduling.test.ts`

- [ ] **Step 1: Write failing scheduling tests**

```ts
import { describe, expect, it } from "vitest";
import { findEarliestSlot } from "./scheduling";

describe("findEarliestSlot", () => {
  it("uses the earliest slot inside activity hours that avoids fixed blocks", () => {
    const result = findEarliestSlot({
      date: "2026-06-01",
      durationMinutes: 60,
      activityStart: "09:00",
      activityEnd: "18:00",
      fixedBlocks: [{ start: "2026-06-01T09:00:00+09:00", end: "2026-06-01T10:30:00+09:00" }],
      timeZoneOffset: "+09:00"
    });
    expect(result).toEqual({ start: "2026-06-01T01:30:00.000Z", end: "2026-06-01T02:30:00.000Z" });
  });

  it("returns null when no sufficiently long slot exists", () => {
    const result = findEarliestSlot({
      date: "2026-06-01",
      durationMinutes: 120,
      activityStart: "09:00",
      activityEnd: "11:00",
      fixedBlocks: [{ start: "2026-06-01T09:30:00+09:00", end: "2026-06-01T10:00:00+09:00" }],
      timeZoneOffset: "+09:00"
    });
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/domain/scheduling.test.ts`

Expected: FAIL because `findEarliestSlot` does not exist.

- [ ] **Step 3: Implement slot calculation**

```ts
// src/domain/scheduling.ts
export interface TimeBlock { start: string; end: string }
export interface SlotRequest {
  date: string;
  durationMinutes: number;
  activityStart: string;
  activityEnd: string;
  fixedBlocks: TimeBlock[];
  timeZoneOffset: string;
}

export function findEarliestSlot(input: SlotRequest): TimeBlock | null {
  const start = new Date(`${input.date}T${input.activityStart}:00${input.timeZoneOffset}`);
  const end = new Date(`${input.date}T${input.activityEnd}:00${input.timeZoneOffset}`);
  const blocks = [...input.fixedBlocks].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  let cursor = start;
  for (const block of blocks) {
    const blockStart = new Date(block.start);
    if (blockStart.getTime() - cursor.getTime() >= input.durationMinutes * 60_000) {
      return { start: cursor.toISOString(), end: new Date(cursor.getTime() + input.durationMinutes * 60_000).toISOString() };
    }
    const blockEnd = new Date(block.end);
    if (blockEnd > cursor) cursor = blockEnd;
  }
  return end.getTime() - cursor.getTime() >= input.durationMinutes * 60_000
    ? { start: cursor.toISOString(), end: new Date(cursor.getTime() + input.durationMinutes * 60_000).toISOString() }
    : null;
}
```

- [ ] **Step 4: Run the test and verify pass**

Run: `npm test -- src/domain/scheduling.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat: schedule flexible quests into available slots"
```

## Task 4: Add Carryover, Conflict, And Notification Rules

**Files:**
- Create: `src/domain/carryover.ts`
- Create: `src/domain/notifications.ts`
- Create: `src/domain/carryover.test.ts`

- [ ] **Step 1: Write failing carryover tests**

```ts
import { describe, expect, it } from "vitest";
import { reconcileQuest } from "./carryover";
import { quest } from "../test/factories";

describe("reconcileQuest", () => {
  it("keeps a missed quest visible without changing time on the same day", () => {
    const original = quest({ plannedStart: "2026-06-01T09:00:00+09:00" });
    expect(reconcileQuest(original, { today: "2026-06-01", nextDaySlot: null }).quest).toMatchObject({
      status: "due_today",
      plannedStart: original.plannedStart
    });
  });

  it("moves a missed quest on the next day and emits a notification", () => {
    const result = reconcileQuest(quest({ plannedStart: "2026-06-01T09:00:00+09:00" }), {
      today: "2026-06-02",
      nextDaySlot: { start: "2026-06-02T10:00:00+09:00", end: "2026-06-02T11:00:00+09:00" }
    });
    expect(result.quest).toMatchObject({ plannedStart: "2026-06-02T10:00:00+09:00", carryoverCount: 1 });
    expect(result.notification.kind).toBe("carried_over");
  });

  it("requires attention when the next day is full", () => {
    const result = reconcileQuest(quest({ plannedStart: "2026-06-01T09:00:00+09:00" }), {
      today: "2026-06-02",
      nextDaySlot: null
    });
    expect(result.quest.status).toBe("needs_attention");
    expect(result.notification.kind).toBe("conflict");
  });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/domain/carryover.test.ts`

Expected: FAIL because `reconcileQuest` does not exist.

- [ ] **Step 3: Implement reconciliation and essential notifications**

```ts
// src/domain/notifications.ts
export type NotificationKind = "start" | "deadline_soon" | "carried_over" | "conflict";
export interface QuestNotification { kind: NotificationKind; questId: string; message: string }
```

```ts
// src/domain/carryover.ts
import { Quest } from "./types";
import { QuestNotification } from "./notifications";
import { TimeBlock } from "./scheduling";

export function reconcileQuest(quest: Quest, input: { today: string; nextDaySlot: TimeBlock | null }): { quest: Quest; notification: QuestNotification | null } {
  const plannedDate = quest.plannedStart?.slice(0, 10);
  if (plannedDate === input.today) return { quest: { ...quest, status: "due_today" }, notification: null };
  if (input.nextDaySlot) return {
    quest: { ...quest, status: "scheduled", plannedStart: input.nextDaySlot.start, carryoverCount: quest.carryoverCount + 1 },
    notification: { kind: "carried_over", questId: quest.id, message: `${quest.title} moved to ${input.nextDaySlot.start}` }
  };
  return {
    quest: { ...quest, status: "needs_attention" },
    notification: { kind: "conflict", questId: quest.id, message: `${quest.title} needs rescheduling` }
  };
}
```

- [ ] **Step 4: Run the test and verify pass**

Run: `npm test -- src/domain/carryover.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat: reconcile missed quests and notify conflicts"
```

## Task 5: Generate Independent Recurring Quest Instances

**Files:**
- Modify: `src/domain/types.ts`
- Create: `src/domain/recurrence.ts`
- Create: `src/domain/recurrence.test.ts`

- [ ] **Step 1: Write failing recurrence test**

```ts
import { expect, it } from "vitest";
import { generateOccurrence } from "./recurrence";
import { quest } from "../test/factories";

it("creates an independent occurrence without changing the earlier quest", () => {
  const earlier = quest({ id: "original", carryoverCount: 2, status: "due_today" });
  const next = generateOccurrence(earlier, "next-id", "2026-06-02T09:00:00+09:00", "2026-06-02T18:00:00+09:00");
  expect(next).toMatchObject({ id: "next-id", carryoverCount: 0, status: "scheduled" });
  expect(earlier).toMatchObject({ id: "original", carryoverCount: 2, status: "due_today" });
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/domain/recurrence.test.ts`

Expected: FAIL because `generateOccurrence` does not exist.

- [ ] **Step 3: Implement recurrence types and generation**

```ts
export type RecurrenceRule =
  | { frequency: "daily" }
  | { frequency: "weekdays" }
  | { frequency: "selected_weekdays"; weekdays: number[] }
  | { frequency: "weekly" };
```

```ts
// src/domain/recurrence.ts
import { Quest } from "./types";

export function generateOccurrence(source: Quest, id: string, plannedStart: string, deadline: string): Quest {
  return { ...source, id, plannedStart, deadline, carryoverCount: 0, status: "scheduled" };
}
```

- [ ] **Step 4: Run the test and verify pass**

Run: `npm test -- src/domain/recurrence.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain
git commit -m "feat: generate independent recurring quests"
```

## Task 6: Add SQLite Persistence And Read-Only Calendar Adapter

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/server/db.ts`
- Create: `src/server/calendar/calendar-source.ts`
- Create: `src/server/calendar/local-calendar-source.ts`
- Create: `src/server/calendar/import-calendar.ts`
- Create: `src/server/calendar/import-calendar.test.ts`

- [ ] **Step 1: Write the failing adapter test**

```ts
import { expect, it } from "vitest";
import { importCalendar } from "./import-calendar";

it("imports fixed blocks through a read-only calendar source", async () => {
  const source = { listEvents: async () => [{ externalId: "meeting", title: "Meeting", start: "2026-06-01T09:00:00+09:00", end: "2026-06-01T10:00:00+09:00" }] };
  await expect(importCalendar(source, "2026-06-01", "2026-06-07")).resolves.toHaveLength(1);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/server/calendar/import-calendar.test.ts`

Expected: FAIL because `importCalendar` does not exist.

- [ ] **Step 3: Add Prisma models and adapter interface**

```prisma
model Quest {
  id             String   @id @default(cuid())
  title          String
  kind           String
  deadline       DateTime
  expectedMinutes Int
  plannedStart   DateTime?
  importance     Int
  carryoverCount Int      @default(0)
  status         String
  recurrenceJson String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model CalendarBlock {
  id         String   @id @default(cuid())
  externalId String   @unique
  title      String
  start      DateTime
  end        DateTime
  updatedAt  DateTime @updatedAt
}
```

```ts
// src/server/calendar/calendar-source.ts
export interface ImportedCalendarEvent { externalId: string; title: string; start: string; end: string }
export interface CalendarSource { listEvents(from: string, to: string): Promise<ImportedCalendarEvent[]> }
```

```ts
// src/server/calendar/import-calendar.ts
import { CalendarSource } from "./calendar-source";
export async function importCalendar(source: CalendarSource, from: string, to: string) {
  return source.listEvents(from, to);
}
```

- [ ] **Step 4: Generate database client and run test**

Run: `npm run db:generate`

Run: `npm run db:push`

Run: `npm test -- src/server/calendar/import-calendar.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma src/server
git commit -m "feat: persist quests and import read-only calendar blocks"
```

## Task 7: Expose Quest, Settings, And Reconciliation APIs

**Files:**
- Create: `src/server/services/quest-service.ts`
- Create: `src/server/services/scheduling-service.ts`
- Create: `src/server/services/index.ts`
- Create: `src/app/api/quests/route.ts`
- Create: `src/app/api/quests/[id]/complete/route.ts`
- Create: `src/app/api/quests/[id]/abandon/route.ts`
- Create: `src/app/api/schedule/reconcile/route.ts`
- Create: `src/app/api/settings/route.ts`
- Create: `src/server/services/quest-service.test.ts`

- [ ] **Step 1: Write failing quest service test**

```ts
import { expect, it } from "vitest";
import { createQuestService } from "./quest-service";

it("creates a validated flexible quest", async () => {
  const saved: unknown[] = [];
  const service = createQuestService({ save: async (quest) => { saved.push(quest); return quest; } });
  await service.create({ title: "Write report", kind: "flexible", deadline: "2026-06-02T18:00:00+09:00", expectedMinutes: 60, importance: 2 });
  expect(saved).toHaveLength(1);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/server/services/quest-service.test.ts`

Expected: FAIL because `createQuestService` does not exist.

- [ ] **Step 3: Implement validation and API route handlers**

```ts
// src/server/services/quest-service.ts
import { z } from "zod";

const questInput = z.object({
  title: z.string().min(1),
  kind: z.enum(["flexible", "fixed"]),
  deadline: z.string().datetime({ offset: true }),
  expectedMinutes: z.number().int().positive(),
  importance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  plannedStart: z.string().datetime({ offset: true }).nullable().optional()
}).refine((value) => value.kind === "flexible" || Boolean(value.plannedStart), "Fixed quests require a planned start");

export function createQuestService(repository: { save(input: z.infer<typeof questInput>): Promise<unknown> }) {
  return { create: (input: unknown) => repository.save(questInput.parse(input)) };
}
```

```ts
// src/app/api/quests/route.ts
import { NextResponse } from "next/server";
import { questService } from "@/server/services";

export async function GET() {
  return NextResponse.json(await questService.list());
}

export async function POST(request: Request) {
  return NextResponse.json(await questService.create(await request.json()), { status: 201 });
}
```

Use the same thin-handler shape for the remaining route files:

```ts
// src/app/api/quests/[id]/complete/route.ts
import { NextResponse } from "next/server";
import { questService } from "@/server/services";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json(await questService.complete((await params).id));
}
```

```ts
// src/app/api/quests/[id]/abandon/route.ts
import { NextResponse } from "next/server";
import { questService } from "@/server/services";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json(await questService.abandon((await params).id));
}
```

```ts
// src/app/api/schedule/reconcile/route.ts
import { NextResponse } from "next/server";
import { schedulingService } from "@/server/services";
export async function POST() {
  return NextResponse.json(await schedulingService.reconcile(new Date()));
}
```

```ts
// src/app/api/settings/route.ts
import { NextResponse } from "next/server";
import { settingsService } from "@/server/services";
export async function GET() { return NextResponse.json(await settingsService.get()); }
export async function PUT(request: Request) { return NextResponse.json(await settingsService.update(await request.json())); }
```

Keep validation and business rules inside services, not route files.

Create `src/server/services/index.ts` as the composition root. It exports `questService`, `settingsService`, and `schedulingService` instances backed by the Prisma repositories. API routes import only from this file.

- [ ] **Step 4: Run service tests**

Run: `npm test -- src/server/services`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server src/app/api
git commit -m "feat: expose quest scheduling APIs"
```

## Task 8: Build The Responsive Priority List

**Files:**
- Create: `src/components/app-shell.tsx`
- Create: `src/components/quest-list.tsx`
- Create: `src/components/quest-card.tsx`
- Create: `src/components/slide-to-complete.tsx`
- Create: `src/components/completion-toast.tsx`
- Create: `src/components/quest-list.test.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write failing list component test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { QuestList } from "./quest-list";
import { quest } from "@/test/factories";

it("shows overdue quests first with resolution actions", () => {
  render(<QuestList quests={[quest({ id: "a", title: "Normal" }), quest({ id: "b", title: "Late", status: "overdue" })]} />);
  expect(screen.getAllByRole("article")[0]).toHaveTextContent("Late");
  expect(screen.getByRole("button", { name: "새 마감 설정" })).toBeVisible();
  expect(screen.getByRole("button", { name: "포기" })).toBeVisible();
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/components/quest-list.test.tsx`

Expected: FAIL because `QuestList` does not exist.

- [ ] **Step 3: Implement desktop and mobile list behavior**

```tsx
// src/components/quest-list.tsx
import { sortQuests } from "@/domain/priority";
import { Quest } from "@/domain/types";
import { QuestCard } from "./quest-card";

export function QuestList({ quests }: { quests: Quest[] }) {
  return <section aria-label="우선순위 퀘스트">{sortQuests(quests).map((quest) => <QuestCard key={quest.id} quest={quest} />)}</section>;
}
```

```tsx
// src/components/quest-card.tsx
import { Quest } from "@/domain/types";

export function QuestCard({ quest }: { quest: Quest }) {
  return <article data-status={quest.status}>
    <h2>{quest.title}</h2>
    <p>마감 {quest.deadline}</p>
    <p>밀린 횟수 {quest.carryoverCount}</p>
    <button>완료</button>
    {quest.status === "overdue" && <><button>새 마감 설정</button><button>포기</button></>}
  </article>;
}
```

Add CSS media queries so desktop uses a content-and-details layout while mobile uses bottom navigation, large touch targets, and the slide completion control.

- [ ] **Step 4: Run component tests**

Run: `npm test -- src/components`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components src/app
git commit -m "feat: add responsive priority quest list"
```

## Task 9: Add Quest Creation, Calendar Views, Settings, And Conflict UI

**Files:**
- Create: `src/components/quest-form.tsx`
- Create: `src/components/calendar-grid.tsx`
- Create: `src/components/attention-panel.tsx`
- Create: `src/app/calendar/day/page.tsx`
- Create: `src/app/calendar/week/page.tsx`
- Create: `src/app/settings/page.tsx`
- Create: `src/components/quest-form.test.tsx`

- [ ] **Step 1: Write failing form test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { QuestForm } from "./quest-form";

it("requires planned time only for fixed-time quests", () => {
  render(<QuestForm onSubmit={() => undefined} />);
  fireEvent.change(screen.getByLabelText("유형"), { target: { value: "fixed" } });
  expect(screen.getByLabelText("실행 예정 시각")).toBeRequired();
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- src/components/quest-form.test.tsx`

Expected: FAIL because `QuestForm` does not exist.

- [ ] **Step 3: Implement the form and secondary screens**

```tsx
// src/components/quest-form.tsx
"use client";
import { useState } from "react";

export function QuestForm({ onSubmit }: { onSubmit(input: FormData): void }) {
  const [kind, setKind] = useState("flexible");
  return <form action={onSubmit}>
    <label>제목<input name="title" required /></label>
    <label>유형<select aria-label="유형" name="kind" value={kind} onChange={(event) => setKind(event.target.value)}>
      <option value="flexible">유연한 퀘스트</option><option value="fixed">시간 지정 퀘스트</option>
    </select></label>
    {kind === "fixed" && <label>실행 예정 시각<input name="plannedStart" type="datetime-local" required /></label>}
    <label>마감 시각<input name="deadline" type="datetime-local" required /></label>
    <label>예상 소요 시간<input name="expectedMinutes" type="number" min="1" required /></label>
    <button type="submit">퀘스트 추가</button>
  </form>;
}
```

Add these explicit presentation contracts:

```tsx
// src/components/calendar-grid.tsx
export function CalendarGrid({ blocks }: { blocks: { id: string; title: string; start: string; end: string; source: "quest" | "calendar" }[] }) {
  return <ol aria-label="시간표">{blocks.map((block) => <li key={block.id} data-source={block.source}>{block.start} - {block.end} {block.title}</li>)}</ol>;
}
```

```tsx
// src/components/attention-panel.tsx
export function AttentionPanel({ questTitle, onNearestDate, onSwap, onEdit }: { questTitle: string; onNearestDate(): void; onSwap(): void; onEdit(): void }) {
  return <aside aria-label="사용자 확인 필요"><h2>{questTitle}</h2><p>다음 날에 충분한 빈 시간이 없습니다.</p>
    <button onClick={onNearestDate}>가장 가까운 날짜로 이동</button>
    <button onClick={onSwap}>낮은 우선순위 퀘스트 교체</button>
    <button onClick={onEdit}>직접 수정</button>
  </aside>;
}
```

The settings page submits `{ weekdayStart, weekdayEnd, weekendStart, weekendEnd, defaultView }` to `PUT /api/settings`. The daily and weekly pages render `CalendarGrid` with internal quest slots and imported fixed blocks.

- [ ] **Step 4: Run component tests**

Run: `npm test -- src/components`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components src/app
git commit -m "feat: add quest form calendars settings and conflicts"
```

## Task 10: Add Desktop And Mobile Browser Flows

**Files:**
- Create: `e2e/quest-flow.spec.ts`
- Create: `e2e/mobile-flow.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Write failing desktop browser test**

```ts
import { expect, test } from "@playwright/test";

test("creates and completes a quest from the priority list", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "퀘스트 추가" }).click();
  await page.getByLabel("제목").fill("보고서 작성");
  await page.getByLabel("마감 시각").fill("2026-06-02T18:00");
  await page.getByLabel("예상 소요 시간").fill("60");
  await page.getByRole("button", { name: "퀘스트 추가" }).click();
  await expect(page.getByRole("heading", { name: "보고서 작성" })).toBeVisible();
  await page.getByRole("article").filter({ hasText: "보고서 작성" }).getByRole("button", { name: "완료" }).click();
  await expect(page.getByText("오늘 완료 1개")).toBeVisible();
});
```

- [ ] **Step 2: Write failing mobile browser test**

```ts
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("shows mobile navigation and slide completion", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "모바일 메뉴" })).toBeVisible();
  await expect(page.getByText("밀어서 완료")).toBeVisible();
});
```

- [ ] **Step 3: Run tests and verify failure**

Run: `npm run test:e2e`

Expected: FAIL until the client uses APIs and the responsive shell is wired end to end.

- [ ] **Step 4: Wire UI to APIs and satisfy browser flows**

Add a client API module and use it from the client components:

```ts
// src/client/api.ts
export async function listQuests() { return fetch("/api/quests").then((response) => response.json()); }
export async function createQuest(input: unknown) { return fetch("/api/quests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }).then((response) => response.json()); }
export async function completeQuest(id: string) { return fetch(`/api/quests/${id}/complete`, { method: "POST" }).then((response) => response.json()); }
export async function abandonQuest(id: string) { return fetch(`/api/quests/${id}/abandon`, { method: "POST" }).then((response) => response.json()); }
export async function reconcileSchedule() { return fetch("/api/schedule/reconcile", { method: "POST" }).then((response) => response.json()); }
```

Use these functions in the list, form, completion, and conflict actions. After each mutation, refresh the list. When completion succeeds, display `CompletionToast` with `오늘 완료 1개`. Seed local fixed blocks through `LocalCalendarSource` for a stable browser test fixture.

- [ ] **Step 5: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run test:e2e`

Expected: PASS for desktop and mobile flows.

Run: `npm run build`

Expected: Next.js production build succeeds.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "test: verify desktop and mobile quest calendar flows"
```

## Task 11: Document Local Operation And Follow-Up Integrations

**Files:**
- Create: `README.md`
- Create: `docs/superpowers/plans/2026-05-30-google-calendar-production-integration.md`

- [ ] **Step 1: Write the local run documentation**

```md
# Quest Calendar

## Local Setup

1. Copy `.env.example` to `.env`.
2. Run `npm install`.
3. Run `npm run db:generate`.
4. Run `npm run db:push`.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.

## Verification

- `npm test`
- `npm run test:e2e`
- `npm run build`

## MVP Boundary

The local MVP uses a read-only local calendar adapter. Google OAuth, Google Calendar API calls, hosted background reconciliation, and production notification delivery are separate integration work.
```

- [ ] **Step 2: Record the next integration plan scope**

Create the follow-up plan with these explicit tasks:

1. Configure Google OAuth with calendar read-only scope.
2. Replace `LocalCalendarSource` with `GoogleCalendarSource`.
3. Add account-scoped persistence and session enforcement.
4. Deploy date-boundary reconciliation as a scheduled job using each user's configured time zone.
5. Add browser push subscription persistence and hosted delivery.
6. Verify synchronization failure preserves the last valid imported blocks.

- [ ] **Step 3: Run final verification**

Run: `npm test && npm run test:e2e && npm run build`

Expected: All checks pass.

- [ ] **Step 4: Commit**

```bash
git add README.md docs
git commit -m "docs: add local setup and production integration scope"
```

## Self-Review Notes

- Spec coverage: priority order, overdue behavior, activity hours, fixed blocks, earliest-slot placement, same-day visibility, next-day carryover, capacity conflicts, recurring instances, desktop UI, mobile-specific UI, restrained completion feedback, and essential notifications are covered.
- Deferred by explicit boundary: real Google OAuth, real Calendar API calls, hosted scheduled jobs, and production notification delivery.
- Placeholder scan: no implementation placeholders remain; later production work is explicitly separated into a follow-up plan.
- Type consistency: domain status values, quest kinds, priority fields, carryover fields, and calendar adapter signatures are used consistently across tasks.
