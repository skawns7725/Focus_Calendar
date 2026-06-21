import { NextResponse } from "next/server";
import { getRequestServices } from "@/server/services/request-services";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { studyPlanService } = await getRequestServices(request);
  const completed = await studyPlanService.completeBlock((await params).id);
  return completed
    ? NextResponse.json(completed)
    : NextResponse.json({ error: "공부 블록을 찾지 못했습니다." }, { status: 404 });
}
