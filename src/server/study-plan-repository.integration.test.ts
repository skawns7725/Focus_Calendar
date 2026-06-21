import { afterAll, describe, expect, it } from "vitest";
import { toStudyBlockScheduleCandidates } from "@/domain/study-plan";
import { db } from "./db";
import { PrismaStudyPlanRepository } from "./study-plan-repository";

const runPostgresIntegration = process.env.RUN_POSTGRES_INTEGRATION === "1";
const ownerA = `study-integration-a-${process.pid}`;
const ownerB = `study-integration-b-${process.pid}`;

describe.runIf(runPostgresIntegration)("PrismaStudyPlanRepository with PostgreSQL", () => {
  afterAll(async () => {
    await db.studyPlan.deleteMany({ where: { ownerId: { in: [ownerA, ownerB] } } });
  });

  it("stores a plan with blocks and isolates lists by owner", async () => {
    const repositoryA = new PrismaStudyPlanRepository(ownerA);
    const repositoryB = new PrismaStudyPlanRepository(ownerB);

    const created = await createPlan(repositoryA, "owner-a-plan");

    expect(created.blocks).toHaveLength(2);
    await expect(repositoryA.list()).resolves.toEqual([
      expect.objectContaining({ id: created.id, blocks: expect.arrayContaining([
        expect.objectContaining({ title: "Database concept" }),
        expect.objectContaining({ title: "Database practice" })
      ]) })
    ]);
    await expect(repositoryB.list()).resolves.toEqual([]);
  });

  it("blocks another owner from completion and persists the owning user's completion", async () => {
    const repositoryA = new PrismaStudyPlanRepository(ownerA);
    const repositoryB = new PrismaStudyPlanRepository(ownerB);
    const created = await createPlan(repositoryA, "completion-plan");
    const blockId = created.blocks[0].id;

    await expect(repositoryB.completeBlock(blockId)).resolves.toBeNull();
    await expect(repositoryA.completeBlock(blockId)).resolves.toEqual({ id: blockId, status: "completed" });
    await expect(db.studyBlock.findUniqueOrThrow({ where: { id: blockId } })).resolves.toMatchObject({
      status: "completed"
    });
  });

  it("excludes a persisted completed block from schedule candidates", async () => {
    const repository = new PrismaStudyPlanRepository(ownerA);
    const created = await createPlan(repository, "candidate-plan");
    const completed = created.blocks[0];

    await repository.completeBlock(completed.id);
    const [stored] = (await repository.list()).filter((plan) => plan.id === created.id);
    const candidates = toStudyBlockScheduleCandidates(stored.blocks, completed.date);

    expect(candidates).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: completed.id })
    ]));
  });

  it("cascades block deletion when Prisma deletes the plan", async () => {
    const repository = new PrismaStudyPlanRepository(ownerA);
    const created = await createPlan(repository, "cascade-plan");
    const blockIds = created.blocks.map((block) => block.id);

    await db.studyPlan.delete({ where: { id: created.id } });

    await expect(db.studyBlock.count({ where: { id: { in: blockIds } } })).resolves.toBe(0);
  });
});

function createPlan(repository: PrismaStudyPlanRepository, examName: string) {
  return repository.createWithBlocks({
    examName,
    subject: "Database",
    examDate: "2026-07-01",
    scope: "Transactions and indexing",
    progress: 20,
    difficulty: 2,
    dailyMinutes: 90
  }, [
    {
      studyPlanId: "pending",
      date: "2026-06-23",
      stage: "concept",
      title: "Database concept",
      durationMinutes: 40,
      sequence: 1,
      status: "pending"
    },
    {
      studyPlanId: "pending",
      date: "2026-06-23",
      stage: "practice",
      title: "Database practice",
      durationMinutes: 30,
      sequence: 2,
      status: "pending"
    }
  ]);
}
