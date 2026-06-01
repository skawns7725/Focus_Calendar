"use client";

import { useEffect, useState } from "react";
import { listUnreadNotifications, markNotificationsRead } from "@/client/api";
import { BellIcon } from "./icons";
import { DisplayNotification } from "./attention-panel";

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listUnreadNotifications().then(setNotifications).catch(() => undefined);
  }, []);

  async function markAllRead() {
    await markNotificationsRead(notifications.map((notification) => notification.id));
    setNotifications([]);
    setOpen(false);
  }

  const label = notifications.length ? `알림 ${notifications.length}개` : "알림";
  return (
    <div className="notification-center">
      <button aria-label={label} className="icon-button notification-trigger" type="button" onClick={() => setOpen((value) => !value)}>
        <BellIcon />
        {notifications.length > 0 && <span>{notifications.length}</span>}
      </button>
      {open && <section aria-label="알림 목록" className="notification-popover">
        <div><p className="eyebrow">알림</p><h2>확인할 내용</h2></div>
        {notifications.length === 0 ? <p>새로운 알림이 없습니다.</p> : notifications.map((notification) => <p key={notification.id}>{notification.message}</p>)}
        {notifications.length > 0 && <button className="secondary-button" type="button" onClick={() => void markAllRead()}>모두 확인</button>}
      </section>}
    </div>
  );
}
