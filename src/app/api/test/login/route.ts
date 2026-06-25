import { NextResponse } from "next/server";
import { serializeSessionCookie } from "@/server/auth/cookies";
import { createPreviewTestUserIdentity, isPreviewTestLoginEnabled, isPreviewTestLoginSecretValid, readPreviewTestLoginSecret } from "@/server/auth/preview-test-login";
import { SessionRepository } from "@/server/auth/session-repository";
import { UserRepository } from "@/server/auth/user-repository";

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isPreviewTestLoginEnabled()) {
    return NextResponse.json({ error: "Preview test login is disabled" }, { status: 401 });
  }

  if (!isPreviewTestLoginSecretValid(readPreviewTestLoginSecret(request), process.env.PREVIEW_TEST_LOGIN_SECRET)) {
    return NextResponse.json({ error: "Unauthorized preview test login" }, { status: 401 });
  }

  const identity = createPreviewTestUserIdentity();
  const user = await new UserRepository().upsertPreviewTestUser({
    id: identity.id,
    googleSubject: identity.googleSubject,
    email: identity.email
  });
  const token = await new SessionRepository().create(user.id);
  const response = NextResponse.json({
    ok: true,
    ownerKind: "preview-test",
    createdFor: identity.createdFor
  });
  response.headers.set("set-cookie", serializeSessionCookie(token, true));
  return response;
}
