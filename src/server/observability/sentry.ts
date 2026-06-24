import * as Sentry from "@sentry/nextjs";
import { sanitizeErrorContext } from "./sensitive-data";

export function captureServerError(error: unknown, context: Record<string, unknown> = {}) {
  if (!isSentryConfigured()) return;
  Sentry.captureException(error, {
    extra: sanitizeErrorContext(context)
  });
}

export function isSentryConfigured() {
  return Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);
}
