import { beforeEach, expect, it, vi } from "vitest";
import { GET } from "./route";

const scheduleMocks = vi.hoisted(() => ({
  reconcile: vi.fn(async () => ({ carryovers: [], today: { placements: [], unplaced: [] } })),
  dispatch: vi.fn(async () => ({ sent: 0 })),
  sync: vi.fn(async () => ({ importedCalendars: 0 }))
}));

vi.mock("@/server/services", () => ({
  createUserServices: vi.fn(() => ({
    schedulingService: { reconcile: scheduleMocks.reconcile },
    pushService: { dispatch: scheduleMocks.dispatch }
  }))
}));
vi.mock("@/server/google", () => ({
  createGoogleServices: vi.fn(() => ({
    googleSyncService: { sync: scheduleMocks.sync }
  }))
}));
vi.mock("@/server/services/owner-registry", () => ({
  listOwnerIds: vi.fn(async () => ["owner-1"])
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

it("requires a scheduler secret for Vercel Cron reconcile GET requests", async () => {
  vi.stubEnv("SCHEDULER_SECRET", "secret");

  const response = await GET(new Request("https://focus-calendar.example/api/schedule/reconcile"));

  expect(response.status).toBe(401);
  expect(scheduleMocks.reconcile).not.toHaveBeenCalled();
});

it("allows authorized Vercel Cron reconcile GET requests through the normal idempotent reconcile path", async () => {
  vi.stubEnv("SCHEDULER_SECRET", "secret");

  const response = await GET(new Request("https://focus-calendar.example/api/schedule/reconcile", {
    headers: { authorization: "Bearer secret" }
  }));

  expect(response.status).toBe(200);
  expect(scheduleMocks.reconcile).toHaveBeenCalledTimes(1);
  expect(scheduleMocks.sync).toHaveBeenCalledTimes(1);
  expect(scheduleMocks.dispatch).toHaveBeenCalledTimes(1);
});
