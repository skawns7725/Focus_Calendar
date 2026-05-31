import { GoogleConnectionRepository } from "./google-connection-repository";
import { PrismaGoogleSyncRepository } from "./google-sync-repository";
import { createGoogleSyncService } from "./google-sync-service";

export function createGoogleServices(ownerId: string) {
  const googleConnectionRepository = new GoogleConnectionRepository(ownerId);
  const googleSyncRepository = new PrismaGoogleSyncRepository(ownerId);
  return {
    googleConnectionRepository,
    googleSyncRepository,
    googleSyncService: createGoogleSyncService(googleConnectionRepository, googleSyncRepository)
  };
}

export const { googleConnectionRepository, googleSyncRepository, googleSyncService } = createGoogleServices("local");
