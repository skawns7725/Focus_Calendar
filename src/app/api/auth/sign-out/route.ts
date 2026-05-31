import { NextResponse } from "next/server";
import { clearSessionCookie, readSessionToken } from "@/server/auth/cookies";
import { SessionRepository } from "@/server/auth/session-repository";

export async function POST(request: Request) {
  const token = readSessionToken(request);
  if (token) await new SessionRepository().delete(token);
  const response = NextResponse.json({ signedOut: true });
  response.headers.set("set-cookie", clearSessionCookie());
  return response;
}
