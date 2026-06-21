import { NextResponse } from "next/server";
import { createUserServices } from "@/server/services";
import { isSchedulerAuthorized } from "@/server/scheduler-auth";
import { createGoogleServices } from "@/server/google";
import { getRequestServices } from "@/server/services/request-services";
import { listOwnerIds } from "@/server/services/owner-registry";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (authorization && !isSchedulerAuthorized(authorization, process.env.SCHEDULER_SECRET)) {
    return NextResponse.json({ error: "Unauthorized scheduler request" }, { status: 401 });
  }
  if (authorization && process.env.SCHEDULER_SECRET) {
    const results = [];
    for (const ownerId of await listOwnerIds()) {
      const result = await reconcileOwner(ownerId);
      results.push(...result.carryovers);
    }
    return NextResponse.json(results);
  }
  const { actor } = await getRequestServices(request);
  return NextResponse.json(await reconcileOwner(actor.ownerId));
}

async function reconcileOwner(ownerId: string) {
  const { schedulingService, pushService } = createUserServices(ownerId);
  const { googleSyncService } = createGoogleServices(ownerId);
  const result = await schedulingService.reconcile(new Date());
  await googleSyncService.sync().catch(() => undefined);
  await pushService.dispatch(new Date()).catch(() => undefined);
  return result;
}
