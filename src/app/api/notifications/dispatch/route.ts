import { NextResponse } from "next/server";
import { createUserServices } from "@/server/services";
import { isSchedulerAuthorized, schedulerSecret } from "@/server/scheduler-auth";
import { captureServerError } from "@/server/observability/sentry";
import { listOwnerIds } from "@/server/services/owner-registry";

export async function POST(request: Request) {
  return dispatchNotifications(request);
}

export async function GET(request: Request) {
  return dispatchNotifications(request);
}

async function dispatchNotifications(request: Request) {
  if (!schedulerSecret() || !isSchedulerAuthorized(request.headers.get("authorization"), schedulerSecret())) {
    return NextResponse.json({ error: "Unauthorized scheduler request" }, { status: 401 });
  }
  try {
    let sent = 0;
    for (const ownerId of await listOwnerIds()) sent += (await createUserServices(ownerId).pushService.dispatch(new Date())).sent;
    return NextResponse.json({ sent });
  } catch (error) {
    captureServerError(error, { source: "notification_dispatch_cron" });
    return NextResponse.json({ error: "Unable to dispatch notifications" }, { status: 500 });
  }
}
