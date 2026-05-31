import { NextResponse } from "next/server";
import { getRequestServices } from "@/server/services/request-services";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { questService } = await getRequestServices(request);
  return NextResponse.json(await questService.update((await params).id, await request.json()));
}
