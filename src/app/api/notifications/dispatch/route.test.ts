import { beforeEach, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const dispatchMocks = vi.hoisted(() => ({
  dispatch: vi.fn(async () => ({ sent: 1 }))
}));

vi.mock("@/server/services", () => ({
  createUserServices: vi.fn(() => ({ pushService: { dispatch: dispatchMocks.dispatch } }))
}));
vi.mock("@/server/services/owner-registry", () => ({
  listOwnerIds: vi.fn(async () => ["owner-1"])
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

it("requires a scheduler secret for Vercel Cron GET requests", async () => {
  vi.stubEnv("SCHEDULER_SECRET", "secret");

  const response = await GET(new Request("https://focus-calendar.example/api/notifications/dispatch"));

  expect(response.status).toBe(401);
  expect(dispatchMocks.dispatch).not.toHaveBeenCalled();
});

it("allows authorized POST and GET dispatches through the same idempotent service path", async () => {
  vi.stubEnv("SCHEDULER_SECRET", "secret");

  const post = await POST(new Request("https://focus-calendar.example/api/notifications/dispatch", {
    method: "POST",
    headers: { authorization: "Bearer secret" }
  }));
  const get = await GET(new Request("https://focus-calendar.example/api/notifications/dispatch", {
    headers: { authorization: "Bearer secret" }
  }));

  expect(post.status).toBe(200);
  expect(get.status).toBe(200);
  expect(dispatchMocks.dispatch).toHaveBeenCalledTimes(2);
});
