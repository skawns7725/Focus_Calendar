import webPush from "web-push";
import { ExpiredPushSubscriptionError } from "./push-service";
import { PushPayload, StoredPushSubscription } from "./push-types";

export class WebPushGateway {
  constructor() {
    if (isPushConfigured()) {
      webPush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
    }
  }

  async send(subscription: StoredPushSubscription, payload: PushPayload) {
    if (!isPushConfigured()) return;
    try {
      await webPush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth }
      }, JSON.stringify(payload));
    } catch (error) {
      if (isExpired(error)) throw new ExpiredPushSubscriptionError();
      throw error;
    }
  }
}

export function isPushConfigured() {
  return Boolean(process.env.VAPID_SUBJECT && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function isExpired(error: unknown) {
  return typeof error === "object" && error !== null && "statusCode" in error
    && (error.statusCode === 404 || error.statusCode === 410);
}
