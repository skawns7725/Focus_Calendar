import { NextResponse } from "next/server";
import { LocalCalendarSource } from "@/server/calendar/local-calendar-source";
import { importCalendar } from "@/server/calendar/import-calendar";
import { getRequestServices } from "@/server/services/request-services";

export async function POST(request: Request) {
  const { calendarRepository } = await getRequestServices(request);
  const { from, to } = await request.json();
  return NextResponse.json(await calendarRepository.replace(await importCalendar(new LocalCalendarSource([]), from, to)));
}
