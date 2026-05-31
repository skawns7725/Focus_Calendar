import { describe, expect, it } from "vitest";
import { createPushService, ExpiredPushSubscriptionError } from "./push-service";

function createFixtures({ gatewayFails = false } = {}) {
  const subscriptions = new Map([
    ["active", { endpoint: "active", p256dh: "key", auth: "auth" }],
    ["expired", { endpoint: "expired", p256dh: "key", auth: "auth" }]
  ]);
  const notifications = [{ id: "notice-1", kind: "conflict", questId: "q1", message: "다음 날 일정이 가득 찼습니다.", deliveredAt: null as Date | null }];
  const reminders = new Set<string>();
  const sent: Array<{ endpoint: string; payload: { kind: string } }> = [];
  const service = createPushService({
    settings: { get: async () => ({ browserNotificationsEnabled: true, reminderMinutes: 10 }) },
    subscriptions: {
      list: async () => [...subscriptions.values()],
      remove: async (endpoint: string) => { subscriptions.delete(endpoint); }
    },
    notifications: {
      listUndelivered: async () => notifications.filter((notification) => !notification.deliveredAt),
      create: async (notification: { kind: string; questId: string; message: string }) => ({ id: `notice-${notifications.length + 1}`, ...notification }),
      markDelivered: async (ids: string[]) => { notifications.forEach((notification) => { if (ids.includes(notification.id)) notification.deliveredAt = new Date(); }); }
    },
    reminders: {
      listDue: async () => [{ id: "q2", title: "회의 준비", plannedStart: "2026-06-01T09:00:00.000Z" }],
      wasSent: async (questId: string, start: string) => reminders.has(`${questId}:${start}`),
      markSent: async (questId: string, start: string) => { reminders.add(`${questId}:${start}`); }
    },
    gateway: {
      send: async (subscription, payload) => {
        if (subscription.endpoint === "expired") throw new ExpiredPushSubscriptionError();
        if (gatewayFails) throw new Error("temporary provider failure");
        sent.push({ endpoint: subscription.endpoint, payload });
      }
    }
  });
  return { service, subscriptions, notifications, sent };
}

describe("push service", () => {
  it("delivers persisted notices and removes expired subscriptions", async () => {
    const { service, subscriptions, sent } = createFixtures();
    await service.dispatch(new Date("2026-06-01T08:50:00.000Z"));
    expect(sent.some((delivery) => delivery.payload.kind === "conflict")).toBe(true);
    expect(subscriptions.has("expired")).toBe(false);
  });

  it("sends a start reminder only once for a scheduled occurrence", async () => {
    const { service, sent } = createFixtures();
    await service.dispatch(new Date("2026-06-01T08:50:00.000Z"));
    await service.dispatch(new Date("2026-06-01T08:51:00.000Z"));
    expect(sent.filter((delivery) => delivery.payload.kind === "start")).toHaveLength(1);
  });

  it("keeps notifications pending when no browser receives them", async () => {
    const { service, notifications } = createFixtures({ gatewayFails: true });
    await service.dispatch(new Date("2026-06-01T08:50:00.000Z"));
    expect(notifications[0].deliveredAt).toBeNull();
  });
});
