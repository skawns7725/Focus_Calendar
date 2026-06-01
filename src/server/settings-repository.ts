import { db } from "./db";

export interface UserSettings {
  weekdayStart: string;
  weekdayEnd: string;
  weekendStart: string;
  weekendEnd: string;
  defaultView: "list" | "day" | "week";
  timeZone: string;
  theme: "light" | "dark" | "system";
  twoWaySync: boolean;
  googleImportMode: "all" | "selected" | null;
  selectedGoogleCalendarIds: string[];
  notificationPromptCompleted: boolean;
  browserNotificationsEnabled: boolean;
  reminderMinutes: number;
}

const defaultSettings: UserSettings = {
  weekdayStart: "09:00",
  weekdayEnd: "22:00",
  weekendStart: "10:00",
  weekendEnd: "22:00",
  defaultView: "list",
  timeZone: "Asia/Seoul",
  theme: "system",
  twoWaySync: false,
  googleImportMode: "all",
  selectedGoogleCalendarIds: [],
  notificationPromptCompleted: false,
  browserNotificationsEnabled: false,
  reminderMinutes: 10
};

export class SettingsRepository {
  constructor(private readonly ownerId = "local") {}

  async get(): Promise<UserSettings> {
    const settings = await db.settings.findUnique({ where: { ownerId: this.ownerId } });
    return settings ? {
      ...settings,
      defaultView: settings.defaultView as UserSettings["defaultView"],
      theme: settings.theme as UserSettings["theme"],
      googleImportMode: (settings.googleImportMode as UserSettings["googleImportMode"]) ?? "all",
      selectedGoogleCalendarIds: JSON.parse(settings.selectedGoogleCalendarIdsJson) as string[]
    } : defaultSettings;
  }

  async update(input: UserSettings): Promise<UserSettings> {
    const settings = await db.settings.upsert({
      where: { ownerId: this.ownerId },
      create: { ownerId: this.ownerId, ...toStoredSettings(input) },
      update: toStoredSettings(input)
    });
    return {
      ...settings,
      defaultView: settings.defaultView as UserSettings["defaultView"],
      theme: settings.theme as UserSettings["theme"],
      googleImportMode: (settings.googleImportMode as UserSettings["googleImportMode"]) ?? "all",
      selectedGoogleCalendarIds: JSON.parse(settings.selectedGoogleCalendarIdsJson) as string[]
    };
  }

  async enableTwoWaySync() {
    const settings = await this.get();
    return this.update({ ...settings, twoWaySync: true });
  }
}

function toStoredSettings(input: UserSettings) {
  const { selectedGoogleCalendarIds, ...settings } = input;
  return { ...settings, selectedGoogleCalendarIdsJson: JSON.stringify(selectedGoogleCalendarIds) };
}
