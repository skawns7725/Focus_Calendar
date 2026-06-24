import { NextResponse } from "next/server";
import { buildGoogleAuthorizationUrl, getGoogleOAuthStateSecret, getGoogleRedirectUri, requireEnv } from "@/server/google/google-auth";
import { createGoogleOAuthState } from "@/server/google/google-oauth-state";
import { authService } from "@/server/auth/auth-service";
import { isGoogleCalendarWriteEnabled } from "@/server/google/google-feature-flags";

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get("mode") === "write" ? "write" : "read";
  if (mode === "write" && !isGoogleCalendarWriteEnabled()) {
    return NextResponse.json({ error: "Google Calendar write sync is disabled" }, { status: 403 });
  }
  try {
    const actor = mode === "write" ? await authService.getActor(request) : null;
    if (mode === "write" && (!actor || actor.localDevelopment)) {
      return NextResponse.json({ error: "Sign in before requesting write access" }, { status: 401 });
    }
    return NextResponse.redirect(buildGoogleAuthorizationUrl({
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      redirectUri: getGoogleRedirectUri(),
      state: createGoogleOAuthState(mode, getGoogleOAuthStateSecret(), Date.now(), actor?.ownerId),
      mode
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google OAuth is not configured" }, { status: 503 });
  }
}
