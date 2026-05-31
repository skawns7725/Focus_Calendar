import { NextResponse } from "next/server";
import { authService } from "@/server/auth/auth-service";
import { UserRepository } from "@/server/auth/user-repository";

export async function GET(request: Request) {
  const actor = await authService.getActor(request);
  if (!actor) return NextResponse.json({ signedIn: false, localDevelopment: false, email: null });
  const user = actor.localDevelopment ? null : await new UserRepository().get(actor.ownerId);
  return NextResponse.json({ signedIn: !actor.localDevelopment, localDevelopment: actor.localDevelopment, email: user?.email ?? null });
}
