import { PushPayload, StoredPushSubscription } from "./push-types";

export class ExpiredPushSubscriptionError extends Error {}

interface PushDependencies {
  settings: { get(): Promise<{ browserNotificationsEnabled: boolean; reminderMinutes: number }> };
  subscriptions: { list(): Promise<StoredPushSubscription[]>; remove(endpoint: string): Promise<unknown> };
  notifications: {
    listUndelivered(): Promise<Array<{ id: string; kind: string; questId: string; message: string }>>;
    create(notification: { kind: string; questId: string; message: string }): Promise<{ id: string }>;
    markDelivered(ids: string[]): Promise<unknown>;
  };
  reminders: {
    listDue(now: Date, reminderMinutes: number): Promise<Array<{ id: string; title: string; plannedStart: string | Date | null }>>;
    wasSent(questId: string, scheduledStart: string): Promise<boolean>;
    markSent(questId: string, scheduledStart: string): Promise<unknown>;
  };
  gateway: { send(subscription: StoredPushSubscription, payload: PushPayload): Promise<void> };
}

export function createPushService(dependencies: PushDependencies) {
  return {
    async dispatch(now = new Date()) {
      const settings = await dependencies.settings.get();
      if (!settings.browserNotificationsEnabled) return { sent: 0 };
      const subscriptions = await dependencies.subscriptions.list();
      const notices = await dependencies.notifications.listUndelivered();
      const deliveredNoticeIds: string[] = [];
      let sent = 0;

      for (const notice of notices) {
        const delivered = await deliverAll(subscriptions, toPayload(notice.kind, notice.questId, notice.message), dependencies);
        sent += delivered;
        if (delivered > 0) deliveredNoticeIds.push(notice.id);
      }
      if (deliveredNoticeIds.length) await dependencies.notifications.markDelivered(deliveredNoticeIds);

      for (const quest of await dependencies.reminders.listDue(now, settings.reminderMinutes)) {
        const scheduledStart = new Date(quest.plannedStart!).toISOString();
        if (await dependencies.reminders.wasSent(quest.id, scheduledStart)) continue;
        const body = `${quest.title} 시작 ${settings.reminderMinutes}분 전입니다.`;
        const notice = await dependencies.notifications.create({ kind: "start", questId: quest.id, message: body });
        await dependencies.reminders.markSent(quest.id, scheduledStart);
        const delivered = await deliverAll(subscriptions, toPayload("start", quest.id, body), dependencies);
        sent += delivered;
        if (delivered > 0) await dependencies.notifications.markDelivered([notice.id]);
      }
      return { sent };
    }
  };
}

async function deliverAll(
  subscriptions: StoredPushSubscription[],
  payload: PushPayload,
  dependencies: PushDependencies
) {
  let sent = 0;
  for (const subscription of subscriptions) {
    try {
      await dependencies.gateway.send(subscription, payload);
      sent += 1;
    } catch (error) {
      if (error instanceof ExpiredPushSubscriptionError) await dependencies.subscriptions.remove(subscription.endpoint);
    }
  }
  return sent;
}

function toPayload(kind: string, questId: string, body: string): PushPayload {
  return { kind, questId, title: "Focus Calendar", body, url: "/" };
}
