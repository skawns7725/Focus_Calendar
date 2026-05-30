"use client";

import { useEffect, useState } from "react";
import { Quest } from "@/domain/types";
import { abandonQuest, completeQuest, createQuest, listQuests } from "@/client/api";
import { AppShell } from "./app-shell";
import { CompletionToast } from "./completion-toast";
import { QuestForm, QuestDraft } from "./quest-form";
import { QuestList } from "./quest-list";

export function Dashboard() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);

  async function refresh() {
    setQuests(await listQuests());
  }

  useEffect(() => { void refresh(); }, []);

  async function addQuest(input: QuestDraft) {
    await createQuest(input);
    await refresh();
    setShowForm(false);
  }

  async function finishQuest(id: string) {
    await completeQuest(id);
    setCompletedCount((count) => count + 1);
    setToastVisible(true);
    await refresh();
    window.setTimeout(() => setToastVisible(false), 2400);
  }

  async function abandon(id: string) {
    await abandonQuest(id);
    await refresh();
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
      {showForm && <div className="form-panel"><div><p className="eyebrow">새 할 일</p><h2>할 일 등록</h2></div><QuestForm onSubmit={addQuest} /></div>}
      <div className="list-heading"><div><p className="eyebrow">우선순위 목록</p><h2>지금 처리할 순서</h2></div><span>마감 → 중요도 → 이월 횟수</span></div>
      <QuestList quests={quests} onComplete={finishQuest} onAbandon={abandon} />
      {toastVisible && <CompletionToast completedCount={completedCount} />}
    </AppShell>
  );
}
