import { describe, expect, it } from "vitest";
import { createStudyPlanService } from "./study-plan-service";

describe("createStudyPlanService", () => {
  it("validates a plan and saves generated study blocks", async () => {
    const created: Array<{ plan: unknown; blocks: unknown[] }> = [];
    const service = createStudyPlanService({
      list: async () => [],
      createWithBlocks: async (plan, blocks) => {
        created.push({ plan, blocks });
        return { id: "plan-1", ...plan, blocks: blocks.map((block, index) => ({ id: `block-${index}`, ...block })) };
      },
      completeBlock: async () => null
    }, () => "2026-06-22");

    await service.create({
      examName: "기말고사",
      subject: "열역학",
      examDate: "2026-06-26",
      scope: "1장부터 6장",
      progress: 20,
      difficulty: 3,
      dailyMinutes: 100
    });

    expect(created[0].plan).toMatchObject({ examName: "기말고사", progress: 20, difficulty: 3 });
    expect(created[0].blocks).not.toHaveLength(0);
    expect(created[0].blocks.at(-1)).toMatchObject({ stage: "final_review", date: "2026-06-25" });
  });

  it("returns D-day and risk without storing derived values", async () => {
    const service = createStudyPlanService({
      list: async () => [{
        id: "plan-1",
        examName: "중간고사",
        subject: "수학",
        examDate: "2026-06-25",
        scope: "행렬",
        progress: 10,
        difficulty: 3,
        dailyMinutes: 60,
        blocks: []
      }],
      createWithBlocks: async () => { throw new Error("not used"); },
      completeBlock: async () => null
    }, () => "2026-06-22");

    await expect(service.list()).resolves.toMatchObject([{
      dDay: 3,
      risk: { level: "high", score: 150 }
    }]);
  });

  it("persists study block completion", async () => {
    const completed: string[] = [];
    const service = createStudyPlanService({
      list: async () => [],
      createWithBlocks: async () => { throw new Error("not used"); },
      completeBlock: async (id) => { completed.push(id); return { id, status: "completed" }; }
    }, () => "2026-06-22");

    await service.completeBlock("block-1");

    expect(completed).toEqual(["block-1"]);
  });

  it("rejects invalid progress and a non-future exam date", async () => {
    const service = createStudyPlanService({
      list: async () => [],
      createWithBlocks: async () => { throw new Error("must not save"); },
      completeBlock: async () => null
    }, () => "2026-06-22");

    await expect(service.create({
      examName: "시험",
      subject: "수학",
      examDate: "2026-06-22",
      scope: "전 범위",
      progress: 101,
      difficulty: 2,
      dailyMinutes: 60
    })).rejects.toThrow();
  });
});
