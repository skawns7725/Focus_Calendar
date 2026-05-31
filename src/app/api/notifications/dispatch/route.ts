import { NextResponse } from "next/server";
import { pushService } from "@/server/services";
import { isSchedulerAuthorized } from "@/server/scheduler-auth";

export async function POST(request: Request) {
  if (!isSchedulerAuthorized(request.headers.get("authorization"), process.env.SCHEDULER_SECRET)) {
    return NextResponse.json({ error: "Unauthorized scheduler request" }, { status: 401 });
  }
  return NextResponse.json(await pushService.dispatch(new Date()));
}
