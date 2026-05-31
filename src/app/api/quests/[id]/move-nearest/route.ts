import { NextResponse } from "next/server";
import { schedulingService } from "@/server/services";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const task = await schedulingService.moveToNearestAvailableDay((await params).id, new Date());
  return task
    ? NextResponse.json(task)
    : NextResponse.json({ error: "Unable to find an available day" }, { status: 404 });
}
