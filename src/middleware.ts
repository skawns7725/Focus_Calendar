import { NextRequest, NextResponse } from "next/server";

const separatelyAuthorizedApiPaths = [
  "/api/auth/",
  "/api/google/connect",
  "/api/google/callback",
  "/api/notifications/dispatch",
  "/api/test/login"
];

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== "production" || !request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }
  if (separatelyAuthorizedApiPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname === "/api/schedule/reconcile" && request.headers.get("authorization")) {
    return NextResponse.next();
  }
  if (!request.cookies.get("focus_session")) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"]
};
