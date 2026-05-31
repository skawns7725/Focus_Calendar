export interface DisplayNotification {
  id: string;
  kind: string;
  questId: string;
  message: string;
}

export function AttentionPanel({ notifications, onRead }: { notifications: DisplayNotification[]; onRead(ids: string[]): void }) {
  if (notifications.length === 0) return null;

  return (
    <aside aria-label="일정 변경 알림" className="attention-panel">
      <h2>일정 변경 알림</h2>
      {notifications.map((notification) => <p key={notification.id}>{notification.message}</p>)}
      <button type="button" onClick={() => onRead(notifications.map((notification) => notification.id))}>확인</button>
    </aside>
  );
}
