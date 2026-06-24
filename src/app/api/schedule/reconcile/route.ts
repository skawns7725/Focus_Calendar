import { NextResponse } from "next/server";
import { createUserServices } from "@/server/services";
import { isSchedulerAuthorized, schedulerSecret } from "@/server/scheduler-auth";
import { createGoogleServices } from "@/server/google";
import { captureServerError } from "@/server/observability/sentry";
import { getRequestServices } from "@/server/services/request-services";
import { listOwnerIds } from "@/server/services/owner-registry";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const secret = schedulerSecret();
  if (authorization && (!secret || !isSchedulerAuthorized(authorization, secret))) {
    return NextResponse.json({ error: "Unauthorized scheduler request" }, { status: 401 });
  }
  if (authorization && secret) {
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

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const secret = schedulerSecret();
  if (!secret || !authorization || !isSchedulerAuthorized(authorization, secret)) {
    return NextResponse.json({ error: "Unauthorized scheduler request" }, { status: 401 });
  }
  const results = [];
  for (const ownerId of await listOwnerIds()) {
    const result = await reconcileOwner(ownerId);
    results.push(...result.carryovers);
  }
  return NextResponse.json(results);
}

async function reconcileOwner(ownerId: string) {
  const { schedulingService, pushService } = createUserServices(ownerId);
  const { googleSyncService } = createGoogleServices(ownerId);
  const result = await schedulingService.reconcile(new Date());
  await googleSyncService.sync().catch((error) => captureServerError(error, { source: "scheduler_google_sync" }));
  await pushService.dispatch(new Date()).catch((error) => captureServerError(error, { source: "scheduler_push_dispatch" }));
  return result;
}
