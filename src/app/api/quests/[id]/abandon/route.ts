import { NextResponse } from "next/server";
import { questService } from "@/server/services";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json(await questService.abandon((await params).id));
}

