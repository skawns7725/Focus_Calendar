import { db } from "../db";
import { StoredPushSubscription } from "./push-types";

export class PushSubscriptionRepository {
  list() {
    return db.pushSubscription.findMany({ select: { endpoint: true, p256dh: true, auth: true } });
  }

  upsert(subscription: StoredPushSubscription) {
    return db.pushSubscription.upsert({ where: { endpoint: subscription.endpoint }, create: subscription, update: subscription });
  }

  remove(endpoint: string) {
    return db.pushSubscription.deleteMany({ where: { endpoint } });
  }
}
