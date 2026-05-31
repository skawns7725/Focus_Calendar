import { NextResponse } from "next/server";
import { buildGoogleAuthorizationUrl, getGoogleOAuthStateSecret, getGoogleRedirectUri, requireEnv } from "@/server/google/google-auth";
import { createGoogleOAuthState } from "@/server/google/google-oauth-state";

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get("mode") === "write" ? "write" : "read";
  try {
    return NextResponse.redirect(buildGoogleAuthorizationUrl({
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      redirectUri: getGoogleRedirectUri(),
      state: createGoogleOAuthState(mode, getGoogleOAuthStateSecret()),
      mode
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google OAuth is not configured" }, { status: 503 });
  }
}
