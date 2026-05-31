import { NextResponse } from "next/server";
import { getRequestServices } from "@/server/services/request-services";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { questService } = await getRequestServices(request);
  return NextResponse.json(await questService.complete((await params).id));
}
