import { NextResponse } from "next/server";
import { getRequestServices } from "@/server/services/request-services";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { schedulingService } = await getRequestServices(request);
  const task = await schedulingService.moveToNearestAvailableDay((await params).id, new Date());
  return task
    ? NextResponse.json(task)
    : NextResponse.json({ error: "Unable to find an available day" }, { status: 404 });
}
