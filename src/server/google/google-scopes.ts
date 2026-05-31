export const calendarScopes = {
  read: "https://www.googleapis.com/auth/calendar.readonly",
  write: "https://www.googleapis.com/auth/calendar"
} as const;

export const identityScopes = ["openid", "email", "profile"];
export const readOnlyScopes = [...identityScopes, calendarScopes.read];
export const writeScopes = [...identityScopes, calendarScopes.read, calendarScopes.write];
