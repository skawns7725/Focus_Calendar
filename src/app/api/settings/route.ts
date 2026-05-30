import { NextResponse } from "next/server";
import { settingsService } from "@/server/services";

export async function GET() {
  return NextResponse.json(await settingsService.get());
}

export async function PUT(request: Request) {
  return NextResponse.json(await settingsService.update(await request.json()));
}

