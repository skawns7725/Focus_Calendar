import { NextResponse } from "next/server";
import { schedulingService } from "@/server/services";
import { isSchedulerAuthorized } from "@/server/scheduler-auth";
import { googleSyncService } from "@/server/google";

export async function POST(request: Request) {
  if (!isSchedulerAuthorized(request.headers.get("authorization"), process.env.SCHEDULER_SECRET)) {
    return NextResponse.json({ error: "Unauthorized scheduler request" }, { status: 401 });
  }
  const result = await schedulingService.reconcile(new Date());
  await googleSyncService.sync().catch(() => undefined);
  return NextResponse.json(result);
}
