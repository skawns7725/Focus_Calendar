import { NextResponse } from "next/server";
import { getRequestGoogleServices } from "@/server/services/request-services";

export async function GET(request: Request) {
  const { googleSyncService } = await getRequestGoogleServices(request);
  return NextResponse.json(await googleSyncService.status());
}
