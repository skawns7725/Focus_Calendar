import { NextResponse } from "next/server";
import { isGoogleCalendarWriteEnabled } from "@/server/google/google-feature-flags";
import { captureServerError } from "@/server/observability/sentry";
import { getRequestGoogleServices } from "@/server/services/request-services";

export async function POST(request: Request) {
  if (!isGoogleCalendarWriteEnabled()) {
    return NextResponse.json({ error: "Google Calendar write sync is disabled" }, { status: 403 });
  }
  try {
    const { googleSyncService } = await getRequestGoogleServices(request);
    return NextResponse.json(await googleSyncService.enableTwoWaySync());
  } catch (error) {
    captureServerError(error, { source: "google_two_way_sync" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to enable two-way sync" }, { status: 400 });
  }
}
