import { NextResponse } from "next/server";
import { importLocalCalendar } from "@/server/services";

export async function POST(request: Request) {
  const { from, to } = await request.json();
  return NextResponse.json(await importLocalCalendar(from, to));
}

