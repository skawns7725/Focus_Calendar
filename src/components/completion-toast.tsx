export function CompletionToast({ completedCount }: { completedCount: number }) {
  return <div className="completion-toast" role="status"><strong>완료했습니다</strong><span>오늘 완료 {completedCount}개</span></div>;
}
