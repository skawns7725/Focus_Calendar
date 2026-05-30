import { NextResponse } from "next/server";
import { questService } from "@/server/services";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json(await questService.update((await params).id, await request.json()));
}

