import posthog from "posthog-js";

export type ProductEventName =
  | "study_plan_created"
  | "today_focus_viewed"
  | "task_completed"
  | "task_rescheduled"
  | "calendar_conflict_detected"
  | "recommendation_accepted"
  | "recommendation_ignored";

type SafeAnalyticsValue = string | number | boolean | null | undefined;
type SafeAnalyticsProperties = Record<string, SafeAnalyticsValue>;

const allowedKeys = new Set([
  "count",
  "completedCount",
  "remainingCount",
  "category",
  "durationBucket",
  "riskLevel",
  "sourceType",
  "sourceTypes",
  "reason",
  "importance",
  "hasDueDate"
]);

let initialized = false;

export function initPostHog() {
  if (initialized || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    capture_pageview: true,
    person_profiles: "identified_only"
  });
  initialized = true;
}

export function captureProductEvent(event: ProductEventName, properties: Record<string, unknown> = {}) {
  if (!initialized || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, toSafeAnalyticsProperties(properties));
}

export function toSafeAnalyticsProperties(properties: Record<string, unknown>): SafeAnalyticsProperties {
  const withBucket = {
    ...properties,
    durationBucket: properties.durationBucket ?? durationBucket(properties.expectedMinutes)
  };
  return Object.fromEntries(Object.entries(withBucket)
    .filter(([key, value]) => allowedKeys.has(key) && isSafeValue(value))) as SafeAnalyticsProperties;
}

function durationBucket(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value <= 30) return "short";
  if (value <= 90) return "medium";
  return "long";
}

function isSafeValue(value: unknown): value is SafeAnalyticsValue {
  return value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value);
}
