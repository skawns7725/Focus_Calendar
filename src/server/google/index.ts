import { GoogleConnectionRepository } from "./google-connection-repository";
import { createGoogleSyncService } from "./google-sync-service";

export const googleConnectionRepository = new GoogleConnectionRepository();
export const googleSyncService = createGoogleSyncService(googleConnectionRepository);

