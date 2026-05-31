import { NextResponse } from "next/server";
import { googleSyncService } from "@/server/google";

export async function POST() {
  try {
    return NextResponse.json(await googleSyncService.sync());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sync Google Calendar" }, { status: 400 });
  }
}
