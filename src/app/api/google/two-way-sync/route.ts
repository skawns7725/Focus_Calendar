import { NextResponse } from "next/server";
import { googleSyncService } from "@/server/google";

export async function POST() {
  try {
    return NextResponse.json(await googleSyncService.enableTwoWaySync());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to enable two-way sync" }, { status: 400 });
  }
}

