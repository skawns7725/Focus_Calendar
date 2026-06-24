import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";

const twoWayMocks = vi.hoisted(() => ({
  enableTwoWaySync: vi.fn(async () => ({ id: "calendar-1" }))
}));

vi.mock("@/server/services/request-services", () => ({
  getRequestGoogleServices: vi.fn(async () => ({
    googleSyncService: { enableTwoWaySync: twoWayMocks.enableTwoWaySync }
  }))
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

it("blocks two-way sync unless Google Calendar write sync is explicitly enabled", async () => {
  vi.stubEnv("GOOGLE_CALENDAR_WRITE_ENABLED", "false");

  const response = await POST(new Request("https://focus-calendar.example/api/google/two-way-sync", { method: "POST" }));

  expect(response.status).toBe(403);
  expect(twoWayMocks.enableTwoWaySync).not.toHaveBeenCalled();
});
