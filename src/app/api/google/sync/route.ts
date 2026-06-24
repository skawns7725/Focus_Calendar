import { NextResponse } from "next/server";
import { captureServerError } from "@/server/observability/sentry";
import { getRequestGoogleServices } from "@/server/services/request-services";

export async function POST(request: Request) {
  try {
    const { googleSyncService } = await getRequestGoogleServices(request);
    return NextResponse.json(await googleSyncService.sync());
  } catch (error) {
    captureServerError(error, { source: "google_manual_sync" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to sync Google Calendar" }, { status: 400 });
  }
}
