import { z } from "zod";
import { SettingsRepository } from "../settings-repository";

const settingsInput = z.object({
  weekdayStart: z.string().regex(/^\d{2}:\d{2}$/),
  weekdayEnd: z.string().regex(/^\d{2}:\d{2}$/),
  weekendStart: z.string().regex(/^\d{2}:\d{2}$/),
  weekendEnd: z.string().regex(/^\d{2}:\d{2}$/),
  defaultView: z.enum(["list", "day", "week"]),
  timeZone: z.string().min(1),
  theme: z.enum(["light", "dark", "system"]),
  twoWaySync: z.boolean(),
  googleImportMode: z.enum(["all", "selected"]).nullable(),
  selectedGoogleCalendarIds: z.array(z.string())
});

export function createSettingsService(repository: SettingsRepository) {
  return {
    get: () => repository.get(),
    update: (input: unknown) => repository.update(settingsInput.parse(input))
  };
}
