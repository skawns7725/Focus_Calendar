"use client";

import { useState } from "react";

export interface DisplayNotification {
  id: string;
  kind: string;
  questId: string;
  message: string;
}

export function AttentionPanel({ notifications, onRead }: { notifications: DisplayNotification[]; onRead(ids: string[]): void }) {
  const [expanded, setExpanded] = useState(false);

  if (notifications.length === 0) return null;

  return (
    <aside aria-label="일정 변경 알림" className="attention-panel" data-testid="schedule-change-panel">
      <div className="attention-summary">
        <div>
          <p className="eyebrow">Schedule update</p>
          <h2>일정 변경 알림</h2>
          <p>{notifications.length}개의 변경이 있어요. 오늘 순서가 바뀌었을 수 있습니다.</p>
        </div>
        <div className="attention-actions">
          <button type="button" onClick={() => setExpanded((open) => !open)}>{expanded ? "변경 내역 접기" : "변경 내역 보기"}</button>
          <button type="button" onClick={() => onRead(notifications.map((notification) => notification.id))}>확인</button>
        </div>
      </div>
      {expanded && (
        <ul className="attention-details" data-testid="schedule-change-details">
          {notifications.map((notification) => <li key={notification.id}>{notification.message}</li>)}
        </ul>
      )}
    </aside>
  );
}
