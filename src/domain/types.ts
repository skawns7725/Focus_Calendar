export type QuestStatus =
  | "scheduled"
  | "due_today"
  | "completed"
  | "needs_attention"
  | "overdue"
  | "abandoned";

export type QuestKind = "flexible" | "fixed";
export type QuestCategory = "work" | "personal" | "study" | "health" | "other";

export type RecurrenceRule =
  | { frequency: "daily" }
  | { frequency: "weekdays" }
  | { frequency: "selected_weekdays"; weekdays: number[] }
  | { frequency: "weekly" };

export interface Quest {
  id: string;
  title: string;
  note: string | null;
  location: string | null;
  recurrenceRule: RecurrenceRule | null;
  kind: QuestKind;
  deadline: string;
  expectedMinutes: number;
  category: QuestCategory;
  plannedStart: string | null;
  importance: 1 | 2 | 3;
  carryoverCount: number;
  lastCarryoverDate: string | null;
  status: QuestStatus;
}
