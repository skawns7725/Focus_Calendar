import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getRequestServices } from "@/server/services/request-services";

export async function GET(request: Request) {
  const { studyPlanService } = await getRequestServices(request);
  return NextResponse.json(await studyPlanService.list());
}

export async function POST(request: Request) {
  const { studyPlanService } = await getRequestServices(request);
  try {
    return NextResponse.json(await studyPlanService.create(await request.json()), { status: 201 });
  } catch (error) {
    const message = error instanceof ZodError
      ? error.issues[0]?.message
      : error instanceof Error ? error.message : "시험계획을 만들지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
