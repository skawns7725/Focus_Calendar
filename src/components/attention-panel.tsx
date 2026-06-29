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
          <p>{`오늘 일정 변경 ${notifications.length}건 있음`}</p>
          <span>오늘 순서가 바뀌었을 수 있습니다. 변경된 계획 확인이 필요합니다.</span>
        </div>
        <div className="attention-actions">
          <button type="button" aria-controls="schedule-change-details" aria-expanded={expanded} onClick={() => setExpanded((open) => !open)}>{expanded ? "변경 내역 접기" : "변경 내역 보기"}</button>
          <button type="button" onClick={() => onRead(notifications.map((notification) => notification.id))}>확인</button>
        </div>
      </div>
      {expanded && (
        <ul className="attention-details" data-testid="schedule-change-details" id="schedule-change-details">
          {notifications.map((notification) => <li key={notification.id}>{formatNotificationMessage(notification.message)}</li>)}
        </ul>
      )}
    </aside>
  );
}

function formatNotificationMessage(message: string) {
  const movedMatch = message.match(/^(?<title>.+?) moved to (?<instant>\d{4}-\d{2}-\d{2}T[\d:.]+Z)$/);
  if (!movedMatch?.groups) return message;

  const title = movedMatch.groups.title.trim();
  const instant = new Date(movedMatch.groups.instant);
  if (Number.isNaN(instant.getTime())) return message;

  return `${title}이(가) ${formatKoreanDateTime(instant)}으로 이동되었습니다. Calendar에서 위치를 확인하세요.`;
}

function formatKoreanDateTime(instant: Date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(instant);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const target = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
  const time = `${value.hour}:${value.minute}`;
  return today === target ? `오늘 ${time}` : `${Number(value.month)}월 ${Number(value.day)}일 ${time}`;
}
