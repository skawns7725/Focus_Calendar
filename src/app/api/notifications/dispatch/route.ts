import { NextResponse } from "next/server";
import { createUserServices } from "@/server/services";
import { isSchedulerAuthorized } from "@/server/scheduler-auth";
import { listOwnerIds } from "@/server/services/owner-registry";

export async function POST(request: Request) {
  if (!isSchedulerAuthorized(request.headers.get("authorization"), process.env.SCHEDULER_SECRET)) {
    return NextResponse.json({ error: "Unauthorized scheduler request" }, { status: 401 });
  }
  let sent = 0;
  for (const ownerId of await listOwnerIds()) sent += (await createUserServices(ownerId).pushService.dispatch(new Date())).sent;
  return NextResponse.json({ sent });
}
