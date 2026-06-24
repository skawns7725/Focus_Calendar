const sensitiveKeys = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "database_url",
  "DATABASE_URL",
  "token",
  "accessToken",
  "refreshToken",
  "clientSecret",
  "client_secret",
  "title",
  "summary",
  "note",
  "description",
  "location",
  "email",
  "googleEventTitle",
  "calendarEventTitle"
].map((key) => key.toLowerCase()));

const sensitiveStringPatterns = [
  /DATABASE_URL=[^&\s]+/gi,
  /postgres(?:ql)?:\/\/[^&\s]+/gi,
  /access_token=[^&\s]+/gi,
  /refresh_token=[^&\s]+/gi,
  /code=[^&\s]+/gi,
  /bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
];

export function sanitizeSentryEvent<T extends Record<string, unknown>>(event: T): T {
  return sanitizeValue(event) as T;
}

export function sanitizeErrorContext(context: Record<string, unknown>) {
  return sanitizeObject(context);
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") return sanitizeObject(value as Record<string, unknown>);
  if (typeof value === "string") return sanitizeString(value);
  return value;
}

function sanitizeObject(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input)
    .filter(([key]) => !sensitiveKeys.has(key.toLowerCase()))
    .map(([key, value]) => [key, sanitizeValue(value)]));
}

function sanitizeString(value: string) {
  return sensitiveStringPatterns.reduce((current, pattern) => current.replace(pattern, "[Filtered]"), value);
}
