export function CompletionToast({ completedCount }: { completedCount: number }) {
  return <div className="completion-toast" role="status"><strong>퀘스트 완료</strong><span>오늘 완료 {completedCount}개</span></div>;
}

