import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getRequestServices } from "@/server/services/request-services";

export async function GET(request: Request) {
  const { questService } = await getRequestServices(request);
  return NextResponse.json(await questService.list());
}

export async function POST(request: Request) {
  const { questService, schedulingService } = await getRequestServices(request);
  try {
    const created = await questService.create(await request.json());
    await schedulingService.scheduleToday().catch(() => undefined);
    const scheduled = await questService.list()
      .then((quests) => quests.find((quest) => quest.id === created.id) ?? created)
      .catch(() => created);
    return NextResponse.json(scheduled, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof ZodError ? error.issues[0]?.message : "Unable to create quest" }, { status: 400 });
  }
}
