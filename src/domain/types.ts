export type QuestStatus =
  | "scheduled"
  | "due_today"
  | "completed"
  | "needs_attention"
  | "overdue"
  | "abandoned";

export type QuestKind = "flexible" | "fixed";

export type RecurrenceRule =
  | { frequency: "daily" }
  | { frequency: "weekdays" }
  | { frequency: "selected_weekdays"; weekdays: number[] }
  | { frequency: "weekly" };

export interface Quest {
  id: string;
  title: string;
  kind: QuestKind;
  deadline: string;
  expectedMinutes: number;
  plannedStart: string | null;
  importance: 1 | 2 | 3;
  carryoverCount: number;
  status: QuestStatus;
}
