import { NextResponse } from "next/server";
import { buildGoogleAuthorizationUrl, getGoogleRedirectUri, requireEnv } from "@/server/google/google-auth";

export async function GET(request: Request) {
  const mode = new URL(request.url).searchParams.get("mode") === "write" ? "write" : "read";
  try {
    return NextResponse.redirect(buildGoogleAuthorizationUrl({
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      redirectUri: getGoogleRedirectUri(),
      state: mode,
      mode
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google OAuth is not configured" }, { status: 503 });
  }
}

