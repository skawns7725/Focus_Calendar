import { NextResponse } from "next/server";
import { getRequestServices } from "@/server/services/request-services";

export async function GET(request: Request) {
  const { settingsService } = await getRequestServices(request);
  return NextResponse.json(await settingsService.get());
}

export async function PUT(request: Request) {
  const { settingsService } = await getRequestServices(request);
  return NextResponse.json(await settingsService.update(await request.json()));
}
