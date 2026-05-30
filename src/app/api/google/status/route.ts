import { NextResponse } from "next/server";
import { googleSyncService } from "@/server/google";

export async function GET() {
  return NextResponse.json(await googleSyncService.status());
}

