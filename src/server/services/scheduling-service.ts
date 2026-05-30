import { reconcileQuest } from "@/domain/carryover";
import { findEarliestSlot } from "@/domain/scheduling";
import { CalendarRepository } from "../calendar/calendar-repository";
import { QuestRepository } from "../quest-repository";
import { SettingsRepository } from "../settings-repository";

export function createSchedulingService(
  quests: QuestRepository,
  settings: SettingsRepository,
  calendar: CalendarRepository
) {
  return {
    async reconcile(now = new Date()) {
      const allQuests = await quests.list();
      const userSettings = await settings.get();
      const today = formatDate(now);
      const nextDate = addDays(today, 1);
      const start = new Date(`${nextDate}T00:00:00+09:00`);
      const end = new Date(`${nextDate}T23:59:59+09:00`);
      const fixedBlocks = (await calendar.list(start, end)).map((block) => ({
        start: block.start.toISOString(),
        end: block.end.toISOString()
      }));
      const isWeekend = [0, 6].includes(new Date(`${nextDate}T12:00:00+09:00`).getDay());

      return Promise.all(allQuests
        .filter((quest) => quest.status !== "completed" && quest.status !== "abandoned" && quest.plannedStart)
        .map(async (quest) => {
          const slot = findEarliestSlot({
            date: nextDate,
            durationMinutes: quest.expectedMinutes,
            activityStart: isWeekend ? userSettings.weekendStart : userSettings.weekdayStart,
            activityEnd: isWeekend ? userSettings.weekendEnd : userSettings.weekdayEnd,
            fixedBlocks,
            timeZoneOffset: "+09:00"
          });
          const result = reconcileQuest(quest, { today, nextDaySlot: slot });
          await quests.update(quest.id, result.quest);
          return result;
        }));
    }
  };
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date);
}

function addDays(date: string, amount: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

