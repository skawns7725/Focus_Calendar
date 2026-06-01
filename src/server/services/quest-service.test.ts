import { describe, expect, it } from "vitest";
import { createQuestService } from "./quest-service";

describe("createQuestService", () => {
  it("creates a validated flexible quest", async () => {
    const saved: unknown[] = [];
    const service = createQuestService({
      list: async () => [],
      save: async (quest) => {
        saved.push(quest);
        return quest;
      },
      update: async () => null
    });

    await service.create({
      title: "Write report",
      kind: "flexible",
      deadline: "2026-06-02T18:00:00+09:00",
      expectedMinutes: 60,
      importance: 2
    });

    expect(saved).toHaveLength(1);
  });

  it("trims an optional calendar note", async () => {
    const saved: unknown[] = [];
    const service = createQuestService({
      list: async () => [],
      save: async (quest) => {
        saved.push(quest);
        return quest;
      },
      update: async () => null
    });

    await service.create({
      title: "Write report",
      note: "  자료 링크 확인  ",
      kind: "flexible",
      deadline: "2026-06-02T18:00:00+09:00",
      expectedMinutes: 60,
      importance: 2
    });

    expect(saved).toMatchObject([{ note: "자료 링크 확인" }]);
  });

  it("rejects a fixed quest without a planned start", async () => {
    const service = createQuestService({
      list: async () => [],
      save: async (quest) => quest,
      update: async () => null
    });

    await expect(service.create({
      title: "Meeting prep",
      kind: "fixed",
      deadline: "2026-06-02T18:00:00+09:00",
      expectedMinutes: 60,
      importance: 2
    })).rejects.toThrow("Fixed quests require a planned start");
  });
});
