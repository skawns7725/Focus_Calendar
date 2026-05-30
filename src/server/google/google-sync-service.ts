import { GoogleCalendarClient } from "./google-calendar-client";
import { GoogleConnectionRepository } from "./google-connection-repository";

export function createGoogleSyncService(repository: GoogleConnectionRepository) {
  return {
    status: () => repository.status(),
    async enableTwoWaySync() {
      const connection = await repository.get();
      if (!connection?.accessToken) throw new Error("Google Calendar connection is required");
      const calendar = await new GoogleCalendarClient(connection.accessToken).ensureDedicatedCalendar();
      await repository.setDedicatedCalendar(calendar.id);
      return calendar;
    }
  };
}

