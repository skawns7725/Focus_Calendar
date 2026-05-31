export interface PushStatus {
  configured: boolean;
  publicKey?: string | null;
  notificationPromptCompleted: boolean;
  browserNotificationsEnabled?: boolean;
  reminderMinutes?: number;
}

export function NotificationPreferencePrompt({ status, onEnable, onDisable }: { status: PushStatus; onEnable(): void; onDisable(): void }) {
  if (status.notificationPromptCompleted) return null;
  return (
    <section className="settings-card" aria-label="브라우저 알림 설정">
      <p className="eyebrow">알림 설정</p>
      <h2>일정을 놓치지 않도록 알려드릴까요?</h2>
      <p>시작 전 알림, 자동 이월, 일정 충돌을 브라우저 알림으로 받을 수 있습니다. 이 선택은 설정에서 언제든 바꿀 수 있습니다.</p>
      {!status.configured && <p className="form-error">배포 환경의 Web Push 설정이 필요합니다.</p>}
      <div>
        <button className="primary-button" type="button" disabled={!status.configured} onClick={onEnable}>알림 켜기</button>
        <button className="secondary-button" type="button" onClick={onDisable}>나중에 설정</button>
      </div>
    </section>
  );
}
