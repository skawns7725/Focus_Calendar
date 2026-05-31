import { NextResponse } from "next/server";
import { googleSyncService } from "@/server/google";

export async function GET() {
  try {
    return NextResponse.json(await googleSyncService.listCalendars());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to list Google calendars" }, { status: 400 });
  }
}
