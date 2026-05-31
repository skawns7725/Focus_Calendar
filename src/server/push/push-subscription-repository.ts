import { db } from "../db";
import { StoredPushSubscription } from "./push-types";

export class PushSubscriptionRepository {
  constructor(private readonly ownerId = "local") {}

  list() {
    return db.pushSubscription.findMany({ where: { ownerId: this.ownerId }, select: { endpoint: true, p256dh: true, auth: true } });
  }

  upsert(subscription: StoredPushSubscription) {
    return db.pushSubscription.upsert({ where: { ownerId_endpoint: { ownerId: this.ownerId, endpoint: subscription.endpoint } }, create: { ...subscription, ownerId: this.ownerId }, update: subscription });
  }

  remove(endpoint: string) {
    return db.pushSubscription.deleteMany({ where: { ownerId: this.ownerId, endpoint } });
  }
}
