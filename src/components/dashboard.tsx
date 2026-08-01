"use client";

import { useEffect, useState } from "react";
import { Quest } from "@/domain/types";
import { UnplacedReason } from "@/domain/auto-schedule-today";
import { captureProductEvent } from "@/client/analytics";
import { abandonQuest, completeQuest, completeStudyBlock, createQuest, getGoogleStatus, getPushStatus, listQuests, listStudyPlans, listUnreadNotifications, markNotificationsRead, moveQuestToNearestDay, reconcileSchedule, subscribePush, syncGoogleCalendar, unsubscribePush, updateQuest } from "@/client/api";
import type { StudyBlock, StudyPlanView } from "@/domain/study-plan";
import { enableBrowserNotifications } from "@/client/push";
import { AttentionPanel, DisplayNotification } from "./attention-panel";
import { AppShell } from "./app-shell";
import { CompletionToast } from "./completion-toast";
import { QuestDraft } from "./quest-form";
import { QuestList } from "./quest-list";
import { NotificationPreferencePrompt, PushStatus } from "./notification-preference-prompt";
import { PlusIcon } from "./icons";
import { NowPanel } from "./now-panel";
import { TaskModal } from "./task-modal";
import { TodayFocusBlocks } from "./today-focus-blocks";
import { StudyPlanScheduler } from "./study-plan-scheduler";

export function Dashboard() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [notifications, setNotifications] = useState<DisplayNotification[]>([]);
  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlanView[]>([]);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);
  const [unplacedReasons, setUnplacedReasons] = useState<Partial<Record<string, UnplacedReason>>>({});
  const remainingCount = quests.filter((quest) => quest.status !== "completed" && quest.status !== "abandoned").length;

  async function refresh() {
    setQuests(await listQuests().catch(() => []));
  }

  async function refreshStudyPlans() {
    setStudyPlans(await listStudyPlans().catch(() => []));
  }

  useEffect(() => {
    void syncAndRefresh();
    getPushStatus().then(setPushStatus).catch(() => undefined);
  }, []);

  async function syncAndRefresh() {
    await refresh();
    await refreshStudyPlans();
    const reconciliation = await reconcileSchedule().catch(() => null);
    if (reconciliation) {
      setUnplacedReasons(Object.fromEntries(reconciliation.today.unplaced.map((item) => [item.questId, item.reason])));
    }
    const google = await getGoogleStatus().catch(() => null);
    if (google?.connected) {
      await syncGoogleCalendar()
        .then(() => setSyncWarning(null))
        .catch(() => setSyncWarning("Google Calendar 확인 실패 때문에 일정 충돌 판단이 제한됩니다."));
    }
    await refresh();
    await refreshStudyPlans();
    setNotifications(await listUnreadNotifications().catch(() => []));
  }

  async function addQuest(input: QuestDraft) {
    await createQuest(input);
    await syncAndRefresh();
    setShowForm(false);
  }

  async function finishQuest(id: string) {
    const completed = quests.find((quest) => quest.id === id);
    setQuests((current) => current.map((quest) => quest.id === id ? { ...quest, status: "completed" } : quest));
    try {
      await completeQuest(id);
      captureProductEvent("task_completed", {
        category: completed?.category,
        expectedMinutes: completed?.expectedMinutes,
        sourceType: "quest"
      });
      setCompletedCount((count) => count + 1);
      setToastVisible(true);
      await syncAndRefresh();
      window.setTimeout(() => setToastVisible(false), 2400);
    } catch {
      await refresh();
    }
  }

  async function finishStudyBlock(id: string) {
    const completed = studyPlans.flatMap((plan) => plan.blocks).find((block) => block.id === id);
    setStudyPlans((current) => updateStudyBlockStatus(current, id, "completed"));
    try {
      await completeStudyBlock(id);
      captureProductEvent("task_completed", {
        category: "study",
        expectedMinutes: completed?.durationMinutes,
        sourceType: "study_block"
      });
      setCompletedCount((count) => count + 1);
      setToastVisible(true);
      await refreshStudyPlans();
      window.setTimeout(() => setToastVisible(false), 2400);
    } catch {
      await refreshStudyPlans();
    }
  }

  async function abandon(id: string) {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    await abandonQuest(id);
    await syncAndRefresh();
  }

  async function moveNearest(id: string) {
    await moveQuestToNearestDay(id);
    captureProductEvent("task_rescheduled", { sourceType: "quest" });
    await syncAndRefresh();
  }

  async function editQuest(input: QuestDraft) {
    if (!editingQuest) return;
    await updateQuest(editingQuest.id, input);
    await syncAndRefresh();
    setEditingQuest(null);
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
      title="오늘의 자동 계획"
      subtitle="할 일을 입력하면 오늘의 빈 시간에 자동으로 배치합니다."
      actions={<button className="primary-button" data-testid="add-task-button" type="button" onClick={() => setShowForm((visible) => !visible)}><PlusIcon size={16} />할 일 추가</button>}
    >
      <section className="command-center" aria-label="Command center">
        <TodayFocusBlocks
          quests={quests}
          studyBlocks={studyPlans.flatMap((plan) => plan.blocks)}
          unplacedReasons={unplacedReasons}
          calendarSyncWarning={syncWarning}
          scheduleChangeCount={notifications.length}
          onComplete={(id) => void finishQuest(id)}
          onCompleteStudyBlock={(id) => void finishStudyBlock(id)}
          onAdd={() => setShowForm(true)}
        />
        {syncWarning && (
          <div className="sync-warning command-sync-warning" data-testid="command-sync-warning" role="status">
            <span>{syncWarning}</span>
            <button className="secondary-button" type="button" onClick={() => void syncAndRefresh()}>다시 시도</button>
          </div>
        )}
        <AttentionPanel notifications={notifications} onRead={(ids) => void readNotifications(ids)} />
      </section>

      <section className="dashboard-detail-area" aria-label="Detail and evidence area" data-testid="dashboard-detail-area">
        <details className="dashboard-detail-panel" data-testid="study-plan-detail">
          <summary><span>Study Plan Scheduler</span><strong>시험 공부계획 설정</strong></summary>
          <StudyPlanScheduler onChanged={refreshStudyPlans} />
        </details>

        <details className="dashboard-detail-panel" data-testid="dashboard-summary-detail">
          <summary><span>Dashboard Summary</span><strong>오늘 상태 확인</strong></summary>
          <section className="dashboard-summary">
            <div><span>오늘 완료</span><strong>{completedCount}</strong></div>
            <div><span>남은 할 일</span><strong>{remainingCount}</strong></div>
            <div><span>정렬 기준</span><strong className="summary-text">마감일 우선</strong></div>
          </section>
          {remainingCount > 0 && <NowPanel quests={quests} onAdd={() => setShowForm(true)} onComplete={(id) => void finishQuest(id)} />}
        </details>

        {remainingCount > 0 && (
          <details className="dashboard-detail-panel" data-testid="quest-list-detail">
            <summary><span>QuestList</span><strong>지금 처리할 순서 전체</strong></summary>
            <div className="list-heading"><div><p className="eyebrow">우선순위 목록</p><h2>지금 처리할 순서</h2></div><span>마감 · 중요도 · 이월 횟수</span></div>
            <QuestList quests={quests} onComplete={finishQuest} onDelete={abandon} onNearestDate={(id) => void moveNearest(id)} onEdit={(id) => setEditingQuest(quests.find((quest) => quest.id === id) ?? null)} />
          </details>
        )}
      </section>

      {pushStatus && <NotificationPreferencePrompt status={pushStatus} onEnable={() => void enableNotifications()} onDisable={() => void disableNotifications()} />}
      {(showForm || editingQuest) && <TaskModal key={editingQuest?.id ?? "new"} initialValue={editingQuest ?? undefined} onClose={() => editingQuest ? setEditingQuest(null) : setShowForm(false)} onSubmit={editingQuest ? editQuest : addQuest} />}
      {toastVisible && <CompletionToast completedCount={completedCount} />}
    </AppShell>
  );
}

function updateStudyBlockStatus(plans: StudyPlanView[], blockId: string, status: StudyBlock["status"]) {
  return plans.map((plan) => ({
    ...plan,
    blocks: plan.blocks.map((block) => block.id === blockId ? { ...block, status } : block)
  }));
}
