"use client";

import { useEffect, useState } from "react";
import { Quest } from "@/domain/types";
import { abandonQuest, completeQuest, createQuest, getPushStatus, listQuests, listUnreadNotifications, markNotificationsRead, moveQuestToNearestDay, reconcileSchedule, subscribePush, syncGoogleCalendar, unsubscribePush, updateQuest } from "@/client/api";
import { enableBrowserNotifications } from "@/client/push";
import { AttentionPanel, DisplayNotification } from "./attention-panel";
import { AppShell } from "./app-shell";
import { CompletionToast } from "./completion-toast";
import { QuestForm, QuestDraft } from "./quest-form";
import { QuestList } from "./quest-list";
import { NotificationPreferencePrompt, PushStatus } from "./notification-preference-prompt";

export function Dashboard() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);

  async function refresh() {
    setQuests(await listQuests());
  }

  useEffect(() => {
    void syncAndRefresh();
    getPushStatus().then(setPushStatus).catch(() => undefined);
  }, []);

  async function syncAndRefresh() {
    await reconcileSchedule().catch(() => undefined);
    await syncGoogleCalendar().catch(() => undefined);
    await refresh();
    setNotifications(await listUnreadNotifications().catch(() => []));
  }

  async function addQuest(input: QuestDraft) {
    await createQuest(input);
    await syncAndRefresh();
    setShowForm(false);
  }

  async function finishQuest(id: string) {
    await completeQuest(id);
    setCompletedCount((count) => count + 1);
    setToastVisible(true);
    await syncAndRefresh();
    window.setTimeout(() => setToastVisible(false), 2400);
  }

  async function abandon(id: string) {
    await abandonQuest(id);
    await syncAndRefresh();
  }

  async function moveNearest(id: string) {
    await moveQuestToNearestDay(id);
    await syncAndRefresh();
  }

  async function edit(id: string) {
    const plannedStart = window.prompt("새 예정 시각을 ISO 형식으로 입력하세요. 예: 2026-06-03T09:00:00+09:00");
    if (!plannedStart) return;
    await updateQuest(id, { plannedStart });
    await syncAndRefresh();
  }

  async function readNotifications(ids: string[]) {
    await markNotificationsRead(ids);
    setNotifications((current) => current.filter((notification) => !ids.includes(notification.id)));
  }

  async function enableNotifications() {
    if (!pushStatus?.publicKey) return;
    await subscribePush(await enableBrowserNotifications(pushStatus.publicKey));
    setPushStatus(await getPushStatus());
  }

  async function disableNotifications() {
    await unsubscribePush();
    setPushStatus(await getPushStatus());
  }

  return (
    <AppShell
      title="우선순위 할 일"
      subtitle="고민하지 말고, 위에서부터 하나씩 완료하세요."
      actions={<button className="primary-button" type="button" onClick={() => setShowForm((visible) => !visible)}>+ 할 일 추가</button>}
    >
      <section className="dashboard-summary">
        <div><span>오늘 완료</span><strong>{completedCount}</strong></div>
        <div><span>남은 할 일</span><strong>{quests.filter((quest) => quest.status !== "completed" && quest.status !== "abandoned").length}</strong></div>
        <div><span>정렬 기준</span><strong className="summary-text">마감일 우선</strong></div>
      </section>
      <AttentionPanel notifications={notifications} onRead={(ids) => void readNotifications(ids)} />
      {pushStatus && <NotificationPreferencePrompt status={pushStatus} onEnable={() => void enableNotifications()} onDisable={() => void disableNotifications()} />}
      {showForm && <div className="form-panel"><div><p className="eyebrow">새 할 일</p><h2>할 일 등록</h2></div><QuestForm onSubmit={addQuest} /></div>}
      <div className="list-heading"><div><p className="eyebrow">우선순위 목록</p><h2>지금 처리할 순서</h2></div><span>마감 → 중요도 → 이월 횟수</span></div>
      <QuestList quests={quests} onComplete={finishQuest} onAbandon={abandon} onNearestDate={(id) => void moveNearest(id)} onEdit={(id) => void edit(id)} />
      {toastVisible && <CompletionToast completedCount={completedCount} />}
    </AppShell>
  );
}
