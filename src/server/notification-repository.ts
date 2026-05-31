import { QuestNotification } from "@/domain/notifications";
import { db } from "./db";

export class NotificationRepository {
  constructor(private readonly ownerId = "local") {}

  create(notification: QuestNotification) {
    return db.notification.create({ data: { ...notification, ownerId: this.ownerId } });
  }

  listUnread() {
    return db.notification.findMany({ where: { ownerId: this.ownerId, readAt: null }, orderBy: { createdAt: "desc" } });
  }

  listUndelivered() {
    return db.notification.findMany({ where: { ownerId: this.ownerId, deliveredAt: null }, orderBy: { createdAt: "asc" } });
  }

  markRead(ids: string[]) {
    return db.notification.updateMany({ where: { ownerId: this.ownerId, id: { in: ids } }, data: { readAt: new Date() } });
  }

  markDelivered(ids: string[]) {
    return db.notification.updateMany({ where: { ownerId: this.ownerId, id: { in: ids } }, data: { deliveredAt: new Date() } });
  }
}
