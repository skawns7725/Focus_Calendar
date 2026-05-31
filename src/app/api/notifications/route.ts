import { NextResponse } from "next/server";
import { getRequestServices } from "@/server/services/request-services";

export async function GET(request: Request) {
  const { notificationRepository } = await getRequestServices(request);
  return NextResponse.json(await notificationRepository.listUnread());
}

export async function PATCH(request: Request) {
  const { notificationRepository } = await getRequestServices(request);
  const { ids } = await request.json() as { ids?: string[] };
  return NextResponse.json(await notificationRepository.markRead(ids ?? []));
}
