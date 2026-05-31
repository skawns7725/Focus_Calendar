import { Quest } from "@/domain/types";

export function quest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: "quest-id",
    title: "Sample quest",
    kind: "flexible",
    deadline: "2026-06-02T18:00:00+09:00",
    expectedMinutes: 60,
    plannedStart: "2026-06-01T09:00:00+09:00",
    importance: 1,
    carryoverCount: 0,
    lastCarryoverDate: null,
    status: "scheduled",
    ...overrides
  };
}
