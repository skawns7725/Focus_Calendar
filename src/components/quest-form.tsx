"use client";

import { FormEvent, useState } from "react";

export interface QuestDraft {
  title: string;
  kind: "flexible" | "fixed";
  deadline: string;
  expectedMinutes: number;
  importance: 1 | 2 | 3;
  plannedStart?: string | null;
}

export function QuestForm({ onSubmit }: { onSubmit(input: QuestDraft): void | Promise<void> }) {
  const [kind, setKind] = useState<QuestDraft["kind"]>("flexible");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await onSubmit({
        title: String(data.get("title")),
        kind,
        deadline: withOffset(String(data.get("deadline"))),
        expectedMinutes: Number(data.get("expectedMinutes")),
        importance: Number(data.get("importance")) as 1 | 2 | 3,
        plannedStart: kind === "fixed" ? withOffset(String(data.get("plannedStart"))) : null
      });
      event.currentTarget.reset();
      setKind("flexible");
      setError("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "퀘스트를 추가하지 못했습니다.");
    }
  }

  return (
    <form className="quest-form" onSubmit={submit}>
      <label>제목<input name="title" placeholder="예: 보고서 초안 작성" required /></label>
      <div className="form-row">
        <label>유형<select aria-label="유형" name="kind" value={kind} onChange={(event) => setKind(event.target.value as QuestDraft["kind"])}>
          <option value="flexible">유연한 퀘스트</option><option value="fixed">시간 지정 퀘스트</option>
        </select></label>
        <label>중요도<select name="importance" defaultValue="2"><option value="1">보통</option><option value="2">중요</option><option value="3">매우 중요</option></select></label>
      </div>
      {kind === "fixed" && <label>실행 예정 시각<input aria-label="실행 예정 시각" name="plannedStart" type="datetime-local" required /></label>}
      <div className="form-row">
        <label>마감 시각<input aria-label="마감 시각" name="deadline" type="datetime-local" required /></label>
        <label>예상 소요 시간<input aria-label="예상 소요 시간" name="expectedMinutes" type="number" min="1" defaultValue="30" required /></label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit">퀘스트 추가</button>
    </form>
  );
}

function withOffset(value: string): string {
  return `${value}:00+09:00`;
}

