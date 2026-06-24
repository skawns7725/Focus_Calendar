import { NextResponse } from "next/server";
import { isGoogleCalendarWriteEnabled } from "@/server/google/google-feature-flags";
import { getRequestGoogleServices } from "@/server/services/request-services";

export async function GET(request: Request) {
  const { googleSyncService } = await getRequestGoogleServices(request);
  const status = await googleSyncService.status();
  return NextResponse.json({ ...(status as Record<string, unknown>), writeEnabled: isGoogleCalendarWriteEnabled() });
}
