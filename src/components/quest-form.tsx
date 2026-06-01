"use client";

import { FormEvent, useState } from "react";

export interface QuestDraft {
  title: string;
  note?: string | null;
  location?: string | null;
  kind: "flexible" | "fixed";
  deadline: string;
  expectedMinutes: number;
  importance: 1 | 2 | 3;
  plannedStart?: string | null;
}

export function QuestForm({ initialValue, onCancel, onSubmit }: { initialValue?: QuestDraft; onCancel?(): void; onSubmit(input: QuestDraft): void | Promise<void> }) {
  const [kind, setKind] = useState<QuestDraft["kind"]>(initialValue?.kind ?? "flexible");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await onSubmit({
        title: String(data.get("title")),
        note: String(data.get("note") ?? "").trim() || null,
        location: String(data.get("location") ?? "").trim() || null,
        kind,
        deadline: withOffset(String(data.get("deadline"))),
        expectedMinutes: Number(data.get("expectedMinutes")),
        importance: Number(data.get("importance")) as 1 | 2 | 3,
        plannedStart: kind === "fixed" ? withOffset(String(data.get("plannedStart"))) : null
      });
      if (!initialValue) {
        event.currentTarget.reset();
        setKind("flexible");
      }
      setError("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "할 일을 추가하지 못했습니다.");
    }
  }

  return (
    <form className="quest-form" onSubmit={submit}>
      <label>일정 제목<input name="title" placeholder="예: 보고서 초안 작성" defaultValue={initialValue?.title} required /></label>
      <div className="form-row">
        <label>시간 설정<select aria-label="시간 설정" name="kind" value={kind} onChange={(event) => setKind(event.target.value as QuestDraft["kind"])}>
          <option value="flexible">자동으로 시간 찾기</option><option value="fixed">시작 시간 직접 선택</option>
        </select></label>
        <label>중요도<select name="importance" defaultValue={initialValue?.importance ?? "2"}><option value="1">보통</option><option value="2">중요</option><option value="3">매우 중요</option></select></label>
      </div>
      {kind === "fixed" && <label>시작<input aria-label="시작" name="plannedStart" type="datetime-local" defaultValue={toLocalDateTime(initialValue?.plannedStart)} required /></label>}
      <div className="form-row">
        <label>마감<input aria-label="마감" name="deadline" type="datetime-local" defaultValue={toLocalDateTime(initialValue?.deadline)} required /></label>
        <label>소요 시간<input aria-label="소요 시간" name="expectedMinutes" type="number" min="1" defaultValue={initialValue?.expectedMinutes ?? 30} required /></label>
      </div>
      <label>장소<input name="location" maxLength={300} defaultValue={initialValue?.location ?? ""} placeholder="예: 서울 중앙병원" /></label>
      <label>메모<textarea name="note" rows={3} maxLength={2000} defaultValue={initialValue?.note ?? ""} placeholder="필요한 내용을 자유롭게 적어두세요." /></label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button className="primary-button" type="submit">{initialValue ? "변경사항 저장" : "일정 추가"}</button>
        {onCancel && <button className="secondary-button" type="button" onClick={onCancel}>취소</button>}
      </div>
    </form>
  );
}

function withOffset(value: string): string {
  return `${value}:00+09:00`;
}

function toLocalDateTime(value?: string | null) {
  return value ? value.slice(0, 16) : undefined;
}
