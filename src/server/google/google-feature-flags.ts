export function isGoogleCalendarWriteEnabled(env: Record<string, string | undefined> = process.env) {
  return env.GOOGLE_CALENDAR_WRITE_ENABLED === "true";
}
