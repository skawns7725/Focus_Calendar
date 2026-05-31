import { NextResponse } from "next/server";
import { getRequestGoogleServices } from "@/server/services/request-services";

export async function GET(request: Request) {
  try {
    const { googleSyncService } = await getRequestGoogleServices(request);
    return NextResponse.json(await googleSyncService.listCalendars());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to list Google calendars" }, { status: 400 });
  }
}
