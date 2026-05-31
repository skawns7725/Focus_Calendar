import { GoogleConnectionRepository } from "./google-connection-repository";
import { PrismaGoogleSyncRepository } from "./google-sync-repository";
import { createGoogleSyncService } from "./google-sync-service";

export const googleConnectionRepository = new GoogleConnectionRepository();
export const googleSyncRepository = new PrismaGoogleSyncRepository();
export const googleSyncService = createGoogleSyncService(googleConnectionRepository, googleSyncRepository);
