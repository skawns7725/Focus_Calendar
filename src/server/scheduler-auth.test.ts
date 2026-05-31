import { describe, expect, it } from "vitest";
import { isSchedulerAuthorized } from "./scheduler-auth";

describe("scheduler authorization", () => {
  it("allows local calls when no scheduler secret is configured", () => {
    expect(isSchedulerAuthorized(null, undefined)).toBe(true);
  });

  it("accepts only the configured bearer secret", () => {
    expect(isSchedulerAuthorized("Bearer valid", "valid")).toBe(true);
    expect(isSchedulerAuthorized("Bearer wrong", "valid")).toBe(false);
    expect(isSchedulerAuthorized(null, "valid")).toBe(false);
  });
});
