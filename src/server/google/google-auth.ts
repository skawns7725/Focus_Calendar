import { readOnlyScopes, writeScopes } from "./google-scopes";

interface AuthorizationUrlInput {
  clientId: string;
  redirectUri: string;
  state: string;
  mode: "read" | "write";
}

export function buildGoogleAuthorizationUrl(input: AuthorizationUrlInput): string {
  const scopes = input.mode === "write" ? writeScopes : readOnlyScopes;
  const params = new URLSearchParams({
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: scopes.join(" "),
    state: input.state
  });
  if (input.mode === "write") params.set("include_granted_scopes", "true");
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
}

interface GoogleProfile {
  sub: string;
  email: string;
}

export async function exchangeGoogleCode(code: string, request: typeof fetch = fetch) {
  const response = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code"
    })
  });
  if (!response.ok) throw new Error("Google OAuth token exchange failed");
  return response.json() as Promise<GoogleTokenResponse>;
}

export async function refreshGoogleToken(refreshToken: string, request: typeof fetch = fetch) {
  const response = await request("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) throw new Error("Google OAuth token refresh failed");
  return response.json() as Promise<GoogleTokenResponse>;
}

export async function fetchGoogleProfile(accessToken: string, request: typeof fetch = fetch): Promise<GoogleProfile> {
  const response = await request("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) throw new Error("Google profile lookup failed");
  const profile = await response.json() as Partial<GoogleProfile>;
  if (!profile.sub || !profile.email) throw new Error("Google profile is incomplete");
  return { sub: profile.sub, email: profile.email };
}

export function getGoogleRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/google/callback";
}

export function isGoogleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function requireEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getGoogleOAuthStateSecret() {
  return process.env.GOOGLE_OAUTH_STATE_SECRET || requireEnv("GOOGLE_CLIENT_SECRET");
}
