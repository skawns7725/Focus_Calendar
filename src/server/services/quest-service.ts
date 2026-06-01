import { z } from "zod";
import { sortQuests } from "@/domain/priority";
import { QuestRepository } from "../quest-repository";

const questFields = z.object({
  title: z.string().trim().min(1),
  note: z.string().trim().max(2000).nullable().optional(),
  location: z.string().trim().max(300).nullable().optional(),
  recurrenceRule: z.object({ frequency: z.enum(["daily", "weekdays", "weekly"]) }).nullable().optional(),
  kind: z.enum(["flexible", "fixed"]),
  deadline: z.string().datetime({ offset: true }),
  expectedMinutes: z.number().int().positive(),
  importance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  plannedStart: z.string().datetime({ offset: true }).nullable().optional()
});

const questInput = questFields.refine((value) => value.kind === "flexible" || Boolean(value.plannedStart), {
  message: "Fixed quests require a planned start"
});

export function createQuestService(repository: QuestRepository) {
  return {
    async list() {
      return sortQuests(await repository.list());
    },
    async create(input: unknown) {
      return repository.save(questInput.parse(input));
    },
    complete(id: string) {
      return repository.update(id, { status: "completed" });
    },
    abandon(id: string) {
      return repository.update(id, { status: "abandoned" });
    },
    async update(id: string, input: unknown) {
      const changes = questFields.partial().parse(input);
      return repository.update(id, changes);
    }
  };
}
