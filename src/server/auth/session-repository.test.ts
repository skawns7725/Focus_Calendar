import { afterEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { SessionRepository } from "./session-repository";

const owners = ["test-session-active", "test-session-expired"];

afterEach(async () => {
  await db.session.deleteMany({ where: { ownerId: { in: owners } } });
  await db.user.deleteMany({ where: { id: { in: owners } } });
});

describe("session repository", () => {
  it("stores only a hash and resolves the active owner", async () => {
    await db.user.create({ data: { id: owners[0], googleSubject: owners[0], email: "active@example.com" } });
    const repository = new SessionRepository();
    const token = await repository.create(owners[0]);
    const stored = await db.session.findFirstOrThrow({ where: { ownerId: owners[0] } });
    expect(stored.tokenHash).not.toBe(token);
    expect(await repository.findOwner(token)).toBe(owners[0]);
    await repository.delete(token);
    expect(await repository.findOwner(token)).toBeNull();
  });

  it("does not resolve expired sessions", async () => {
    await db.user.create({ data: { id: owners[1], googleSubject: owners[1], email: "expired@example.com" } });
    const repository = new SessionRepository();
    const token = await repository.create(owners[1], new Date("2026-05-01T00:00:00.000Z"));
    expect(await repository.findOwner(token, new Date("2026-05-02T00:00:00.000Z"))).toBeNull();
  });
});
