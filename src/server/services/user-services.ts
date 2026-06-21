import { CalendarRepository } from "../calendar/calendar-repository";
import { NotificationRepository } from "../notification-repository";
import { PushSubscriptionRepository } from "../push/push-subscription-repository";
import { ReminderRepository } from "../push/reminder-repository";
import { WebPushGateway } from "../push/push-gateway";
import { createPushService } from "../push/push-service";
import { PrismaQuestRepository } from "../quest-repository";
import { SettingsRepository } from "../settings-repository";
import { PrismaStudyPlanRepository } from "../study-plan-repository";
import { createQuestService } from "./quest-service";
import { createSchedulingService } from "./scheduling-service";
import { createSettingsService } from "./settings-service";
import { createStudyPlanService } from "./study-plan-service";

export function createUserServices(ownerId: string) {
  const questRepository = new PrismaQuestRepository(ownerId);
  const settingsRepository = new SettingsRepository(ownerId);
  const calendarRepository = new CalendarRepository(ownerId);
  const notificationRepository = new NotificationRepository(ownerId);
  const pushSubscriptionRepository = new PushSubscriptionRepository(ownerId);
  const studyPlanRepository = new PrismaStudyPlanRepository(ownerId);
  const pushService = createPushService({
    settings: settingsRepository,
    subscriptions: pushSubscriptionRepository,
    notifications: notificationRepository,
    reminders: new ReminderRepository(ownerId),
    gateway: new WebPushGateway()
  });

  return {
    questService: createQuestService(questRepository),
    settingsService: createSettingsService(settingsRepository),
    schedulingService: createSchedulingService(questRepository, settingsRepository, calendarRepository, notificationRepository),
    studyPlanService: createStudyPlanService(studyPlanRepository),
    notificationRepository,
    pushSubscriptionRepository,
    pushService,
    calendarRepository
  };
}
