import { StudyBlock, StudyPlan } from "@/domain/study-plan";
import { db } from "./db";
import type { StudyPlanInput, StudyPlanRepositoryPort } from "./services/study-plan-service";

export class PrismaStudyPlanRepository implements StudyPlanRepositoryPort {
  constructor(private readonly ownerId = "local") {}

  async list(): Promise<StudyPlan[]> {
    const plans = await db.studyPlan.findMany({
      where: { ownerId: this.ownerId },
      include: { blocks: { orderBy: [{ date: "asc" }, { sequence: "asc" }] } },
      orderBy: { examDate: "asc" }
    });
    return plans.map(toStudyPlan);
  }

  async createWithBlocks(plan: StudyPlanInput, blocks: Array<Omit<StudyBlock, "id">>): Promise<StudyPlan> {
    const created = await db.studyPlan.create({
      data: {
        ...plan,
        examDate: dateOnly(plan.examDate),
        ownerId: this.ownerId,
        blocks: {
          create: blocks.map(({ studyPlanId: _studyPlanId, date, ...block }) => ({
            ...block,
            date: dateOnly(date)
          }))
        }
      },
      include: { blocks: { orderBy: [{ date: "asc" }, { sequence: "asc" }] } }
    });
    return toStudyPlan(created);
  }

  async completeBlock(id: string): Promise<Partial<StudyBlock> | null> {
    const result = await db.studyBlock.updateMany({
      where: { id, studyPlan: { ownerId: this.ownerId } },
      data: { status: "completed" }
    });
    return result.count ? { id, status: "completed" } : null;
  }
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toStudyPlan(stored: {
  id: string;
  examName: string;
  subject: string;
  examDate: Date;
  scope: string;
  progress: number;
  difficulty: number;
  dailyMinutes: number;
  blocks: Array<{
    id: string;
    studyPlanId: string;
    title: string;
    date: Date;
    stage: string;
    durationMinutes: number;
    sequence: number;
    status: string;
  }>;
}): StudyPlan {
  return {
    id: stored.id,
    examName: stored.examName,
    subject: stored.subject,
    examDate: stored.examDate.toISOString().slice(0, 10),
    scope: stored.scope,
    progress: stored.progress,
    difficulty: stored.difficulty as StudyPlan["difficulty"],
    dailyMinutes: stored.dailyMinutes,
    blocks: stored.blocks.map((block) => ({
      ...block,
      date: block.date.toISOString().slice(0, 10),
      stage: block.stage as StudyBlock["stage"],
      status: block.status as StudyBlock["status"]
    }))
  };
}
