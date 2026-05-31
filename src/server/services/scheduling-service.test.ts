import { describe, expect, it } from "vitest";
import { Quest } from "@/domain/types";
import { quest } from "@/test/factories";
import { createSchedulingService } from "./scheduling-service";

class FakeQuestRepository {
  constructor(readonly quests = new Map<string, Quest>()) {}
  async list() { return [...this.quests.values()]; }
  async update(id: string, changes: Partial<Quest>) {
    const current = this.quests.get(id);
    if (!current) return null;
    const updated = { ...current, ...changes };
    this.quests.set(id, updated);
    return updated;
  }
}

class FakeCalendarRepository {
  blocks: Array<{ start: Date; end: Date }> = [];
  async list(from: Date, to: Date) {
    return this.blocks.filter((block) => block.start < to && block.end > from);
  }
}

class FakeNotificationRepository {
  notifications: Array<{ kind: string; questId: string; message: string }> = [];
  async create(notification: { kind: string; questId: string; message: string }) {
    this.notifications.push(notification);
    return notification;
  }
}

const settings = {
  get: async () => ({
    weekdayStart: "09:00", weekdayEnd: "12:00", weekendStart: "09:00", weekendEnd: "12:00",
    defaultView: "list" as const, timeZone: "Asia/Seoul", theme: "light" as const, twoWaySync: false,
    googleImportMode: null, selectedGoogleCalendarIds: []
  })
};

describe("scheduling service", () => {
  it("moves only missed tasks once per local date", async () => {
    const quests = new FakeQuestRepository(new Map([
      ["missed", quest({ id: "missed", plannedStart: "2026-06-01T00:00:00.000Z" })],
      ["future", quest({ id: "future", plannedStart: "2026-06-03T00:00:00.000Z" })]
    ]));
    const notifications = new FakeNotificationRepository();
    const service = createSchedulingService(quests, settings, new FakeCalendarRepository(), notifications);

    await service.reconcile(new Date("2026-06-02T01:00:00.000Z"));
    await service.reconcile(new Date("2026-06-02T02:00:00.000Z"));

    expect(quests.quests.get("missed")).toMatchObject({
      plannedStart: "2026-06-02T00:00:00.000Z",
      carryoverCount: 1,
      lastCarryoverDate: "2026-06-02"
    });
    expect(quests.quests.get("future")?.plannedStart).toBe("2026-06-03T00:00:00.000Z");
    expect(notifications.notifications).toHaveLength(1);
  });

  it("allocates competing missed tasks in priority order without overlap", async () => {
    const quests = new FakeQuestRepository(new Map([
      ["later", quest({ id: "later", title: "낮은 우선순위", deadline: "2026-06-05T00:00:00.000Z", expectedMinutes: 60, plannedStart: "2026-06-01T00:00:00.000Z" })],
      ["urgent", quest({ id: "urgent", title: "높은 우선순위", deadline: "2026-06-03T00:00:00.000Z", expectedMinutes: 60, plannedStart: "2026-06-01T01:00:00.000Z" })]
    ]));
    const service = createSchedulingService(quests, settings, new FakeCalendarRepository(), new FakeNotificationRepository());

    await service.reconcile(new Date("2026-06-02T01:00:00.000Z"));

    expect(quests.quests.get("urgent")?.plannedStart).toBe("2026-06-02T00:00:00.000Z");
    expect(quests.quests.get("later")?.plannedStart).toBe("2026-06-02T01:00:00.000Z");
  });

  it("marks a missed task for attention when the current day is full", async () => {
    const quests = new FakeQuestRepository(new Map([
      ["blocked", quest({ id: "blocked", plannedStart: "2026-06-01T00:00:00.000Z" })]
    ]));
    const calendar = new FakeCalendarRepository();
    calendar.blocks = [{ start: new Date("2026-06-02T00:00:00.000Z"), end: new Date("2026-06-02T03:00:00.000Z") }];
    const notifications = new FakeNotificationRepository();

    await createSchedulingService(quests, settings, calendar, notifications).reconcile(new Date("2026-06-02T01:00:00.000Z"));

    expect(quests.quests.get("blocked")).toMatchObject({ status: "needs_attention", lastCarryoverDate: "2026-06-02" });
    expect(notifications.notifications).toHaveLength(1);
    expect(notifications.notifications[0]?.kind).toBe("conflict");
  });

  it("moves a conflict to the nearest available day only when requested", async () => {
    const quests = new FakeQuestRepository(new Map([
      ["blocked", quest({ id: "blocked", status: "needs_attention", plannedStart: "2026-06-01T00:00:00.000Z" })]
    ]));
    const calendar = new FakeCalendarRepository();
    calendar.blocks = [{ start: new Date("2026-06-03T00:00:00.000Z"), end: new Date("2026-06-03T03:00:00.000Z") }];
    const service = createSchedulingService(quests, settings, calendar, new FakeNotificationRepository());

    const moved = await service.moveToNearestAvailableDay("blocked", new Date("2026-06-02T01:00:00.000Z"));

    expect(moved?.plannedStart).toBe("2026-06-04T00:00:00.000Z");
    expect(moved?.status).toBe("scheduled");
  });
});
