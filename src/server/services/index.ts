import { LocalCalendarSource } from "../calendar/local-calendar-source";
import { CalendarRepository } from "../calendar/calendar-repository";
import { importCalendar } from "../calendar/import-calendar";
import { PrismaQuestRepository } from "../quest-repository";
import { SettingsRepository } from "../settings-repository";
import { NotificationRepository } from "../notification-repository";
import { createQuestService } from "./quest-service";
import { createSchedulingService } from "./scheduling-service";
import { createSettingsService } from "./settings-service";

const questRepository = new PrismaQuestRepository();
const settingsRepository = new SettingsRepository();
const calendarRepository = new CalendarRepository();
export const notificationRepository = new NotificationRepository();

export const questService = createQuestService(questRepository);
export const settingsService = createSettingsService(settingsRepository);
export const schedulingService = createSchedulingService(questRepository, settingsRepository, calendarRepository, notificationRepository);

export async function importLocalCalendar(from: string, to: string) {
  const source = new LocalCalendarSource([]);
  return calendarRepository.replace(await importCalendar(source, from, to));
}
