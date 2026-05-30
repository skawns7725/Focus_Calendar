import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { questService } from "@/server/services";

export async function GET() {
  return NextResponse.json(await questService.list());
}

export async function POST(request: Request) {
  try {
    return NextResponse.json(await questService.create(await request.json()), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof ZodError ? error.issues[0]?.message : "Unable to create quest" }, { status: 400 });
  }
}

