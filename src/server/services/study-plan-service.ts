import { z } from "zod";
import { calculateDaysUntilExam, calculateStudyRisk, generateStudyBlocks } from "@/domain/study-plan";
import type { StudyBlock, StudyPlan } from "@/domain/study-plan";

export interface StudyPlanRepositoryPort {
  list(): Promise<StudyPlan[]>;
  createWithBlocks(plan: StudyPlanInput, blocks: Array<Omit<StudyBlock, "id">>): Promise<StudyPlan>;
  completeBlock(id: string): Promise<Partial<StudyBlock> | null>;
}

export interface StudyPlanInput {
  examName: string;
  subject: string;
  examDate: string;
  scope: string;
  progress: number;
  difficulty: 1 | 2 | 3;
  dailyMinutes: number;
}

const inputSchema = z.object({
  examName: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(120),
  examDate: z.string().date(),
  scope: z.string().trim().min(1).max(2000),
  progress: z.number().int().min(0).max(100),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  dailyMinutes: z.number().int().min(30).max(720)
});

export function createStudyPlanService(
  repository: StudyPlanRepositoryPort,
  today: () => string = koreaToday
) {
  const enrich = (plan: StudyPlan) => {
    const currentDate = today();
    return {
      ...plan,
      dDay: calculateDaysUntilExam(plan.examDate, currentDate),
      risk: calculateStudyRisk({
      progress: plan.progress,
      difficulty: plan.difficulty,
      examDate: plan.examDate,
      today: currentDate
      })
    };
  };

  return {
    async list() {
      return (await repository.list()).map(enrich);
    },
    async create(input: unknown) {
      const plan = inputSchema.parse(input);
      const blocks = generateStudyBlocks({
        planId: "pending",
        ...plan,
        today: today()
      });
      return enrich(await repository.createWithBlocks(plan, blocks));
    },
    async completeBlock(id: string) {
      return repository.completeBlock(id);
    }
  };
}

function koreaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}
