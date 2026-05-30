import { db } from "./db";

export interface UserSettings {
  weekdayStart: string;
  weekdayEnd: string;
  weekendStart: string;
  weekendEnd: string;
  defaultView: "list" | "day" | "week";
  timeZone: string;
}

const defaultSettings: UserSettings = {
  weekdayStart: "09:00",
  weekdayEnd: "22:00",
  weekendStart: "10:00",
  weekendEnd: "22:00",
  defaultView: "list",
  timeZone: "Asia/Seoul"
};

export class SettingsRepository {
  async get(): Promise<UserSettings> {
    const settings = await db.settings.findUnique({ where: { id: "local" } });
    return settings ? { ...settings, defaultView: settings.defaultView as UserSettings["defaultView"] } : defaultSettings;
  }

  async update(input: UserSettings): Promise<UserSettings> {
    const settings = await db.settings.upsert({
      where: { id: "local" },
      create: { id: "local", ...input },
      update: input
    });
    return { ...settings, defaultView: settings.defaultView as UserSettings["defaultView"] };
  }
}

