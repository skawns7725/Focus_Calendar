export const calendarScopes = {
  read: "https://www.googleapis.com/auth/calendar.readonly",
  write: "https://www.googleapis.com/auth/calendar"
} as const;

export const readOnlyScopes = [calendarScopes.read];
export const writeScopes = [calendarScopes.read, calendarScopes.write];

