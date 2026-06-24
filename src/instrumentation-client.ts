import * as Sentry from "@sentry/nextjs";
import { sanitizeSentryEvent } from "@/server/observability/sensitive-data";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    beforeSend: (event) => sanitizeSentryEvent(event as unknown as Record<string, unknown>) as unknown as typeof event
  });
}
