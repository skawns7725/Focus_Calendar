import { readSessionToken } from "./cookies";
import { SessionRepository } from "./session-repository";

export interface Actor {
  ownerId: string;
  localDevelopment: boolean;
}

export class UnauthorizedError extends Error {}

interface SessionLookup {
  findOwner(token: string): Promise<string | null>;
}

export function createAuthService(sessions: SessionLookup, environment = process.env.NODE_ENV) {
  return {
    async getActor(request: Request): Promise<Actor | null> {
      const token = readSessionToken(request);
      const ownerId = token ? await sessions.findOwner(token) : null;
      if (ownerId) return { ownerId, localDevelopment: false };
      return environment === "production" ? null : { ownerId: "local", localDevelopment: true };
    },

    async requireActor(request: Request): Promise<Actor> {
      const actor = await this.getActor(request);
      if (!actor) throw new UnauthorizedError("Sign in required");
      return actor;
    }
  };
}

export const authService = createAuthService(new SessionRepository());
