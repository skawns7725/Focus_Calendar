import { beforeEach, describe, expect, it, vi } from "vitest";
import { captureProductEvent, toSafeAnalyticsProperties } from "./analytics";

const posthogMocks = vi.hoisted(() => ({
  capture: vi.fn(),
  init: vi.fn()
}));

vi.mock("posthog-js", () => ({
  default: {
    init: posthogMocks.init,
    capture: posthogMocks.capture
  }
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("analytics safe event helper", () => {
  it("drops private titles, notes, locations, tokens, and emails from event properties", () => {
    const safe = toSafeAnalyticsProperties({
      title: "Private task",
      note: "Private note",
      description: "Private description",
      location: "Home",
      email: "user@example.com",
      token: "secret",
      category: "study",
      expectedMinutes: 95,
      count: 2,
      sourceType: "study_block"
    });

    expect(safe).toEqual({
      category: "study",
      durationBucket: "long",
      count: 2,
      sourceType: "study_block"
    });
  });

  it("does not capture events when PostHog is not configured", () => {
    captureProductEvent("task_completed", { category: "study", expectedMinutes: 15 });

    expect(posthogMocks.capture).not.toHaveBeenCalled();
  });

  it("captures only sanitized properties when PostHog is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "test-key");
    const { initPostHog } = await import("./analytics");
    initPostHog();

    captureProductEvent("task_completed", {
      title: "Private task",
      category: "study",
      expectedMinutes: 15
    });

    expect(posthogMocks.capture).toHaveBeenCalledWith("task_completed", {
      category: "study",
      durationBucket: "short"
    });
  });
});
