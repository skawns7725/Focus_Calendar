import { afterEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { createUserServices } from "./user-services";

const owners = ["test-owner-a", "test-owner-b"];

afterEach(async () => {
  await db.notification.deleteMany({ where: { ownerId: { in: owners } } });
  await db.quest.deleteMany({ where: { ownerId: { in: owners } } });
});

describe("user services", () => {
  it("keeps quests and notifications isolated by owner", async () => {
    const ownerA = createUserServices(owners[0]);
    const ownerB = createUserServices(owners[1]);
    const input = {
      kind: "flexible" as const,
      deadline: "2026-06-02T18:00:00+09:00",
      expectedMinutes: 30,
      importance: 2 as const
    };
    const questA = await ownerA.questService.create({ ...input, title: "owner a task" });
    await ownerB.questService.create({ ...input, title: "owner b task" });
    await ownerA.notificationRepository.create({ kind: "carried_over", questId: questA.id, message: "owner a notice" });

    await expect(ownerA.questService.list()).resolves.toMatchObject([{ title: "owner a task" }]);
    await expect(ownerB.questService.list()).resolves.toMatchObject([{ title: "owner b task" }]);
    await expect(ownerA.notificationRepository.listUnread()).resolves.toHaveLength(1);
    await expect(ownerB.notificationRepository.listUnread()).resolves.toHaveLength(0);
  });
});
