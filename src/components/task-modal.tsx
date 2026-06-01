"use client";

import { QuestForm, QuestDraft } from "./quest-form";
import { CloseIcon } from "./icons";

export function TaskModal({ initialValue, onClose, onSubmit }: { initialValue?: QuestDraft; onClose(): void; onSubmit(input: QuestDraft): void | Promise<void> }) {
  const title = initialValue ? "할 일 수정" : "할 일 추가";
  return (
    <div className="task-modal-backdrop" data-testid="task-modal-backdrop" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section aria-label={title} aria-modal="true" className="task-modal" role="dialog">
        <header className="task-modal-header">
          <div><p className="eyebrow">Focus Calendar</p><h2>{title}</h2></div>
          <button aria-label="닫기" className="icon-button" type="button" onClick={onClose}><CloseIcon /></button>
        </header>
        <QuestForm initialValue={initialValue} onCancel={onClose} onSubmit={onSubmit} />
      </section>
    </div>
  );
}
