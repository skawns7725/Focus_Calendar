import { reconcileQuest } from "@/domain/carryover";
import { autoScheduleTodayWithReasons } from "@/domain/auto-schedule-today";
import { sortQuests } from "@/domain/priority";
import { findEarliestSlot, TimeBlock } from "@/domain/scheduling";
import { addLocalDays, localWeekday, toInstant, toLocalDate } from "@/domain/time-zone";
import { CalendarRepository } from "../calendar/calendar-repository";
import { NotificationRepository } from "../notification-repository";
import { QuestRepository } from "../quest-repository";
import { SettingsRepository } from "../settings-repository";

interface NotificationWriter {
  create(notification: { kind: string; questId: string; message: string }): Promise<unknown>;
}

export function createSchedulingService(
  quests: Pick<QuestRepository, "list" | "update">,
  settings: Pick<SettingsRepository, "get">,
  calendar: Pick<CalendarRepository, "list">,
  notifications: NotificationWriter = new NotificationRepository()
) {
  const scheduleToday = async (now = new Date()) => {
    const userSettings = await settings.get();
    const today = toLocalDate(now, userSettings.timeZone);
    const allQuests = await quests.list();
    const occupied = await blocksForDate(calendar, today, userSettings.timeZone);
    occupied.push(...allQuests
      .filter((quest) => quest.plannedStart
        && quest.status !== "completed"
        && quest.status !== "abandoned"
        && toLocalDate(new Date(quest.plannedStart), userSettings.timeZone) === today)
      .map((quest) => ({
        start: quest.plannedStart!,
        end: new Date(new Date(quest.plannedStart!).getTime() + quest.expectedMinutes * 60_000).toISOString()
      })));
    const isWeekend = [0, 6].includes(localWeekday(today));
    const schedule = autoScheduleTodayWithReasons({
      quests: allQuests,
      date: today,
      activityStart: isWeekend ? userSettings.weekendStart : userSettings.weekdayStart,
      activityEnd: isWeekend ? userSettings.weekendEnd : userSettings.weekdayEnd,
      fixedBlocks: occupied,
      timeZone: userSettings.timeZone,
      now
    });

    for (const placement of schedule.placements) {
      await quests.update(placement.questId, { plannedStart: placement.start, status: "scheduled" });
    }
    return schedule;
  };

  return {
    scheduleToday,
    async reconcile(now = new Date()) {
      const userSettings = await settings.get();
      const today = toLocalDate(now, userSettings.timeZone);
      const fixedBlocks = await blocksForDate(calendar, today, userSettings.timeZone);
      const candidates = sortQuests(await quests.list(), now).filter((quest) => {
        if (quest.status === "completed" || quest.status === "abandoned" || !quest.plannedStart) return false;
        return toLocalDate(new Date(quest.plannedStart), userSettings.timeZone) < today && quest.lastCarryoverDate !== today;
      });
      const results = [];

      for (const quest of candidates) {
        const slot = findSlot(today, quest.expectedMinutes, fixedBlocks, userSettings);
        const result = reconcileQuest(quest, { today, nextDaySlot: slot });
        result.quest.lastCarryoverDate = today;
        await quests.update(quest.id, result.quest);
        if (result.notification) await notifications.create(result.notification);
        if (slot) fixedBlocks.push(slot);
        results.push(result);
      }
      const todaySchedule = await scheduleToday(now);
      return { carryovers: results, today: todaySchedule };
    },

    async moveToNearestAvailableDay(id: string, now = new Date()) {
      const userSettings = await settings.get();
      const task = (await quests.list()).find((quest) => quest.id === id);
      if (!task) return null;
      const today = toLocalDate(now, userSettings.timeZone);

      for (let offset = 1; offset <= 365; offset += 1) {
        const date = addLocalDays(today, offset);
        const fixedBlocks = await blocksForDate(calendar, date, userSettings.timeZone);
        const slot = findSlot(date, task.expectedMinutes, fixedBlocks, userSettings);
        if (!slot) continue;
        const updated = {
          ...task,
          plannedStart: slot.start,
          carryoverCount: task.carryoverCount + 1,
          lastCarryoverDate: today,
          status: "scheduled" as const
        };
        await quests.update(id, updated);
        await notifications.create({ kind: "carried_over", questId: id, message: `${task.title} moved to ${slot.start}` });
        return updated;
      }
      return null;
    }
  };
}

async function blocksForDate(calendar: Pick<CalendarRepository, "list">, date: string, timeZone: string): Promise<TimeBlock[]> {
  const start = toInstant(date, "00:00", timeZone);
  const end = toInstant(addLocalDays(date, 1), "00:00", timeZone);
  return (await calendar.list(start, end)).map((block) => ({ start: block.start.toISOString(), end: block.end.toISOString() }));
}

function findSlot(
  date: string,
  durationMinutes: number,
  fixedBlocks: TimeBlock[],
  settings: Awaited<ReturnType<SettingsRepository["get"]>>
) {
  const isWeekend = [0, 6].includes(localWeekday(date));
  return findEarliestSlot({
    date,
    durationMinutes,
    activityStart: isWeekend ? settings.weekendStart : settings.weekdayStart,
    activityEnd: isWeekend ? settings.weekendEnd : settings.weekdayEnd,
    fixedBlocks,
    timeZone: settings.timeZone
  });
}
