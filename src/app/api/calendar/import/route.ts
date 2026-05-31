import { NextResponse } from "next/server";
import { LocalCalendarSource } from "@/server/calendar/local-calendar-source";
import { importCalendar } from "@/server/calendar/import-calendar";
import { getRequestServices } from "@/server/services/request-services";

export async function POST(request: Request) {
  const { calendarRepository } = await getRequestServices(request);
  const { from, to } = await request.json();
  return NextResponse.json(await calendarRepository.replace(await importCalendar(new LocalCalendarSource([]), from, to)));
}

export async function GET(request: Request) {
  const { calendarRepository } = await getRequestServices(request);
  const { searchParams } = new URL(request.url);
  return NextResponse.json(await calendarRepository.list(
    new Date(searchParams.get("from") ?? new Date().toISOString()),
    new Date(searchParams.get("to") ?? new Date().toISOString())
  ));
}
