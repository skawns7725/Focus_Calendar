import { QuestNotification } from "@/domain/notifications";
import { db } from "./db";

export class NotificationRepository {
  create(notification: QuestNotification) {
    return db.notification.create({ data: notification });
  }

  listUnread() {
    return db.notification.findMany({ where: { readAt: null }, orderBy: { createdAt: "desc" } });
  }

  listUndelivered() {
    return db.notification.findMany({ where: { deliveredAt: null }, orderBy: { createdAt: "asc" } });
  }

  markRead(ids: string[]) {
    return db.notification.updateMany({ where: { id: { in: ids } }, data: { readAt: new Date() } });
  }

  markDelivered(ids: string[]) {
    return db.notification.updateMany({ where: { id: { in: ids } }, data: { deliveredAt: new Date() } });
  }
}
