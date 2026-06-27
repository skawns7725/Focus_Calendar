"use client";

import { FormEvent, useEffect, useState } from "react";
import { captureProductEvent } from "@/client/analytics";
import { completeStudyBlock, createStudyPlan, listStudyPlans } from "@/client/api";
import { StudyBlock, StudyPlanView } from "@/domain/study-plan";

const initialDraft = {
  examName: "",
  subject: "",
  examDate: "",
  scope: "",
  progress: 0,
  difficulty: 2 as 1 | 2 | 3,
  dailyMinutes: 60
};

export function StudyPlanScheduler({ onChanged }: { onChanged?(): void | Promise<void> }) {
  const [plans, setPlans] = useState<StudyPlanView[]>([]);
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});
  const today = todayString();

  useEffect(() => {
    listStudyPlans().then(setPlans).catch(() => setError("시험계획을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await createStudyPlan(draft);
      captureProductEvent("study_plan_created", {
        riskLevel: created.risk.level,
        expectedMinutes: draft.dailyMinutes,
        sourceType: "study_plan"
      });
      setPlans((current) => [...current, created].sort((a, b) => a.examDate.localeCompare(b.examDate)));
      setDraft(initialDraft);
      setFormOpen(false);
      await onChanged?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "시험계획을 만들지 못했습니다. 입력 내용을 확인해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function complete(blockId: string) {
    setError(null);
    setPlans((current) => updateBlockStatus(current, blockId, "completed"));
    try {
      await completeStudyBlock(blockId);
      await onChanged?.();
    } catch {
      setPlans((current) => updateBlockStatus(current, blockId, "pending"));
      setError("완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  return <section className="study-planner" aria-labelledby="study-planner-title" data-testid="study-plan-scheduler">
    <div className="study-planner-heading">
      <div><p className="eyebrow">Study Plan Scheduler</p><h2 id="study-planner-title">시험 공부계획</h2></div>
      <p>시험일까지 역산해 StudyPlan을 만들고, 오늘 실행할 StudyBlock만 먼저 보여줍니다.</p>
    </div>
    <div className="study-plan-flow-copy">
      <p>Quest: 해야 할 목표 · StudyPlan: 목표를 날짜별 학습 계획으로 쪼갠 것</p>
      <p>StudyBlock: 오늘 실제로 처리할 학습 단위 · Today Focus: 지금 먼저 처리할 순서</p>
    </div>
    <div className="study-plan-toolbar">
      <button className="primary-button" type="button" aria-expanded={formOpen} onClick={() => setFormOpen((open) => !open)}>시험 공부계획 만들기</button>
      <span>입력폼은 필요할 때만 열고, 홈은 오늘 실행에 집중합니다.</span>
    </div>
    {formOpen && <form className="study-plan-form" onSubmit={submit}>
      <div className="study-plan-form-grid">
        <label>시험명<input required value={draft.examName} onChange={(event) => setDraft({ ...draft, examName: event.target.value })} /></label>
        <label>과목명<input required value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></label>
        <label>시험일<input required type="date" value={draft.examDate} onChange={(event) => setDraft({ ...draft, examDate: event.target.value })} /></label>
        <label>현재 진행률(%)<input required type="number" min="0" max="100" value={draft.progress} onChange={(event) => setDraft({ ...draft, progress: Number(event.target.value) })} /></label>
        <label>난이도<select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: Number(event.target.value) as 1 | 2 | 3 })}>
          <option value="1">쉬움</option><option value="2">보통</option><option value="3">어려움</option>
        </select></label>
        <label>하루 공부 가능 시간 (분)<input required type="number" min="30" max="720" value={draft.dailyMinutes} onChange={(event) => setDraft({ ...draft, dailyMinutes: Number(event.target.value) })} /></label>
        <label className="study-scope-field">시험범위<textarea required rows={3} value={draft.scope} onChange={(event) => setDraft({ ...draft, scope: event.target.value })} /></label>
      </div>
      <p className="study-plan-buffer-note">입력한 시간의 80%만 계획해 휴식과 일정 변경 여유를 남깁니다.</p>
      <button className="primary-button" disabled={saving} type="submit">{saving ? "계획 만드는 중…" : "공부계획 만들기"}</button>
    </form>}
    {error && <p className="study-plan-error" role="status">{error}</p>}
    {plans.length === 0 ? <div className="study-plan-empty"><strong>아직 시험계획이 없습니다.</strong><span>시험 정보를 입력하면 날짜별 공부 블록이 자동으로 생성됩니다.</span></div> : <div className="study-plan-list">
      {plans.map((plan) => {
        const expanded = expandedPlans[plan.id] ?? false;
        const visibleBlocks = expanded ? plan.blocks : visibleStudyBlocks(plan.blocks, today);
        return <article className="study-plan-card" key={plan.id}>
          <header>
            <div><span className="study-plan-subject">{plan.examDate}</span><h3>{plan.examName} · {plan.subject}</h3></div>
            <div className="study-plan-signals"><strong>{plan.dDay === 0 ? "D-day" : `D-${plan.dDay}`}</strong><span className={`study-risk study-risk-${plan.risk.level}`}>위험도 {riskLabel(plan.risk.level)}</span></div>
          </header>
          <p className="study-risk-reason">{plan.risk.reason}</p>
          <p className="study-plan-scope">범위: {plan.scope}</p>
          <div className="study-block-summary">
            <span>{expanded ? "전체 StudyBlock" : "오늘 실행할 StudyBlock"} {visibleBlocks.length}개 표시</span>
            <button className="secondary-button" type="button" onClick={() => setExpandedPlans((current) => ({ ...current, [plan.id]: !expanded }))}>
              {expanded ? "오늘 계획만 보기" : "전체 계획 보기"}
            </button>
          </div>
          {visibleBlocks.length === 0 ? <p className="study-plan-empty-line">오늘 남은 미완료 StudyBlock은 없습니다. 전체 계획에서 다음 일정을 확인할 수 있어요.</p> : <ol className="study-block-list" data-testid="study-block-list">
            {visibleBlocks.map((block) => <li className={block.status === "completed" ? "completed" : ""} key={block.id} data-testid="study-block-item">
              <time>{block.date}</time>
              <div><strong>{stageLabel(block.stage)}</strong><span>{block.title} · {block.durationMinutes}분</span></div>
              {block.status === "completed" ? <span className="study-block-done">완료됨</span> : <button className="secondary-button" type="button" aria-label={`${block.title} 완료`} onClick={() => void complete(block.id)}>완료</button>}
            </li>)}
          </ol>}
        </article>;
      })}
    </div>}
  </section>;
}

function visibleStudyBlocks(blocks: StudyBlock[], today: string) {
  return blocks
    .filter((block) => block.status !== "completed" && block.date === today)
    .sort((a, b) => a.sequence - b.sequence)
    .slice(0, 3);
}

function updateBlockStatus(plans: StudyPlanView[], blockId: string, status: StudyBlock["status"]) {
  return plans.map((plan) => ({
    ...plan,
    blocks: plan.blocks.map((block) => block.id === blockId ? { ...block, status } : block)
  }));
}

function todayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function stageLabel(stage: StudyBlock["stage"]) {
  return stage === "concept" ? "개념학습" : stage === "practice" ? "문제풀이" : stage === "error_review" ? "오답정리" : "최종복습";
}

function riskLabel(level: StudyPlanView["risk"]["level"]) {
  return level === "high" ? "높음" : level === "medium" ? "보통" : "낮음";
}
