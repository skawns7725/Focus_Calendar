export function SlideToComplete({ onComplete }: { onComplete(): void }) {
  return <button className="slide-complete" type="button" onClick={onComplete}><span>›</span> 밀어서 완료</button>;
}

