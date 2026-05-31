import { authService } from "../auth/auth-service";
import { createGoogleServices } from "../google";
import { createUserServices } from "./user-services";

export async function getRequestServices(request: Request) {
  const actor = await authService.requireActor(request);
  return { actor, ...createUserServices(actor.ownerId) };
}

export async function getRequestGoogleServices(request: Request) {
  const actor = await authService.requireActor(request);
  return { actor, ...createGoogleServices(actor.ownerId) };
}
