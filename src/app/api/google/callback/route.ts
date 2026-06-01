import { NextResponse } from "next/server";
import { exchangeGoogleCode, fetchGoogleProfile, getGoogleOAuthStateSecret } from "@/server/google/google-auth";
import { verifyGoogleOAuthState } from "@/server/google/google-oauth-state";
import { createGoogleServices } from "@/server/google";
import { serializeSessionCookie } from "@/server/auth/cookies";
import { SessionRepository } from "@/server/auth/session-repository";
import { UserRepository } from "@/server/auth/user-repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return NextResponse.json({ error: "Missing Google OAuth callback data" }, { status: 400 });
  try {
    const { mode, ownerId } = verifyGoogleOAuthState(state, getGoogleOAuthStateSecret());
    const token = await exchangeGoogleCode(code);
    const profile = await fetchGoogleProfile(token.access_token);
    const user = await new UserRepository().upsertGoogleProfile(profile);
    if (mode === "write" && ownerId !== user.id) {
      return NextResponse.json({ error: "Google account does not match signed-in account" }, { status: 403 });
    }
    const { googleConnectionRepository, googleSyncService } = createGoogleServices(user.id);
    await googleConnectionRepository.saveTokens({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      scope: token.scope
    });
    if (mode === "write") {
      await googleSyncService.enableTwoWaySync();
    }
    const response = NextResponse.redirect(new URL("/settings?google=connected", request.url));
    response.headers.set("set-cookie", serializeSessionCookie(await new SessionRepository().create(user.id)));
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return NextResponse.redirect(new URL("/settings?google=error", request.url));
  }
}
