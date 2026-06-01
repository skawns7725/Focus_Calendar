"use client";

import { ReactNode, TouchEvent, useRef, useState } from "react";

const SWIPE_THRESHOLD = 72;

export function SwipeActions({ children, onComplete, onDelete, onEdit }: { children: ReactNode; onComplete(): void; onDelete(): void; onEdit(): void }) {
  const startX = useRef<number | null>(null);
  const currentX = useRef<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  function start(event: TouchEvent<HTMLDivElement>) {
    startX.current = event.touches[0]?.clientX ?? null;
    currentX.current = startX.current;
  }

  function move(event: TouchEvent<HTMLDivElement>) {
    currentX.current = event.touches[0]?.clientX ?? currentX.current;
  }

  function finish() {
    const distance = startX.current === null || currentX.current === null ? 0 : currentX.current - startX.current;
    if (distance >= SWIPE_THRESHOLD) {
      setRevealed(false);
      vibrate();
      onComplete();
    } else if (distance <= -SWIPE_THRESHOLD) {
      setRevealed(true);
      vibrate();
    }
    startX.current = null;
    currentX.current = null;
  }

  return (
    <div className={`swipe-shell ${revealed ? "revealed" : ""}`}>
      {revealed && <div className="swipe-actions"><button type="button" onClick={onEdit}>수정</button><button className="danger-action" type="button" onClick={onDelete}>삭제</button></div>}
      <div className="swipe-card-surface" data-testid="swipe-card" onTouchStart={start} onTouchMove={move} onTouchEnd={finish}>{children}</div>
    </div>
  );
}

function vibrate() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
}
