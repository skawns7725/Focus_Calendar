import { NextResponse } from "next/server";
import { exchangeGoogleCode } from "@/server/google/google-auth";
import { googleConnectionRepository, googleSyncService } from "@/server/google";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Missing Google OAuth code" }, { status: 400 });
  const token = await exchangeGoogleCode(code);
  await googleConnectionRepository.saveTokens({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresIn: token.expires_in,
    scope: token.scope
  });
  if (url.searchParams.get("state") === "write") {
    await googleSyncService.enableTwoWaySync();
  }
  return NextResponse.redirect(new URL("/settings?google=connected", request.url));
}
