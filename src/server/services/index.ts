import { LocalCalendarSource } from "../calendar/local-calendar-source";
import { importCalendar } from "../calendar/import-calendar";
import { isPushConfigured } from "../push/push-gateway";
import { createUserServices } from "./user-services";

const localServices = createUserServices("local");
export const { questService, settingsService, schedulingService, notificationRepository, pushSubscriptionRepository, pushService } = localServices;
export { isPushConfigured };
export { createUserServices };

export async function importLocalCalendar(from: string, to: string) {
  const source = new LocalCalendarSource([]);
  return localServices.calendarRepository.replace(await importCalendar(source, from, to));
}
