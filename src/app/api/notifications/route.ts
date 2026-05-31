import { NextResponse } from "next/server";
import { notificationRepository } from "@/server/services";

export async function GET() {
  return NextResponse.json(await notificationRepository.listUnread());
}

export async function PATCH(request: Request) {
  const { ids } = await request.json() as { ids?: string[] };
  return NextResponse.json(await notificationRepository.markRead(ids ?? []));
}
