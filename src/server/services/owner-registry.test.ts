import { afterEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { listOwnerIds } from "./owner-registry";

const ownerId = "test-registry-owner";

afterEach(async () => {
  await db.user.deleteMany({ where: { id: ownerId } });
});

describe("owner registry", () => {
  it("adds the local owner only outside production", async () => {
    await db.user.create({ data: { id: ownerId, googleSubject: ownerId, email: "registry@example.com" } });
    await expect(listOwnerIds("development")).resolves.toContain("local");
    await expect(listOwnerIds("production")).resolves.not.toContain("local");
    await expect(listOwnerIds("production")).resolves.toContain(ownerId);
  });
});
