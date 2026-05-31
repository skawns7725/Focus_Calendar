import { NextResponse } from "next/server";
import { exchangeGoogleCode, getGoogleOAuthStateSecret } from "@/server/google/google-auth";
import { verifyGoogleOAuthState } from "@/server/google/google-oauth-state";
import { googleConnectionRepository, googleSyncService } from "@/server/google";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return NextResponse.json({ error: "Missing Google OAuth callback data" }, { status: 400 });
  const { mode } = verifyGoogleOAuthState(state, getGoogleOAuthStateSecret());
  const token = await exchangeGoogleCode(code);
  await googleConnectionRepository.saveTokens({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    scope: token.scope
  });
  if (mode === "write") {
    await googleSyncService.enableTwoWaySync();
  }
  return NextResponse.redirect(new URL("/settings?google=connected", request.url));
}
