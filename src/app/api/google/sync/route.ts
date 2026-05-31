import { NextResponse } from "next/server";
import { getRequestGoogleServices } from "@/server/services/request-services";

export async function POST(request: Request) {
  try {
    const { googleSyncService } = await getRequestGoogleServices(request);
    return NextResponse.json(await googleSyncService.sync());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sync Google Calendar" }, { status: 400 });
  }
}
