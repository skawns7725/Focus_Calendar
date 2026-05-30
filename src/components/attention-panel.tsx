export function AttentionPanel({ questTitle, onNearestDate, onSwap, onEdit }: { questTitle: string; onNearestDate(): void; onSwap(): void; onEdit(): void }) {
  return <aside aria-label="사용자 확인 필요" className="attention-panel"><h2>{questTitle}</h2><p>다음 날에 충분한 빈 시간이 없습니다.</p><div><button onClick={onNearestDate}>가장 가까운 날짜로 이동</button><button onClick={onSwap}>우선순위가 낮은 할 일과 교체</button><button onClick={onEdit}>직접 수정</button></div></aside>;
}
