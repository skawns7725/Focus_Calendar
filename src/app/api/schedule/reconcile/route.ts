import { NextResponse } from "next/server";
import { schedulingService } from "@/server/services";

export async function POST() {
  return NextResponse.json(await schedulingService.reconcile(new Date()));
}

