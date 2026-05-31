import { afterEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { GoogleConnectionRepository } from "./google-connection-repository";
import { PrismaGoogleSyncRepository } from "./google-sync-repository";

const owners = ["test-google-a", "test-google-b"];

afterEach(async () => {
  await db.calendarBlock.deleteMany({ where: { ownerId: { in: owners } } });
  await db.googleCalendarCursor.deleteMany({ where: { ownerId: { in: owners } } });
  await db.googleConnection.deleteMany({ where: { ownerId: { in: owners } } });
});

describe("google repositories", () => {
  it("stores matching external identifiers separately for each owner", async () => {
    const ownerA = new PrismaGoogleSyncRepository(owners[0]);
    const ownerB = new PrismaGoogleSyncRepository(owners[1]);
    await ownerA.setCursor("primary", "cursor-a");
    await ownerB.setCursor("primary", "cursor-b");
    const block = { externalId: "primary:event-1", calendarId: "primary", googleEventId: "event-1", title: "Busy", start: "2026-06-01T09:00:00.000Z", end: "2026-06-01T10:00:00.000Z" };
    await ownerA.upsertBlock(block);
    await ownerB.upsertBlock(block);
    await new GoogleConnectionRepository(owners[0]).saveTokens({ accessToken: "token-a", expiresIn: 3600 });
    await new GoogleConnectionRepository(owners[1]).saveTokens({ accessToken: "token-b", expiresIn: 3600 });

    await expect(ownerA.getCursor("primary")).resolves.toBe("cursor-a");
    await expect(ownerB.getCursor("primary")).resolves.toBe("cursor-b");
    await expect(db.calendarBlock.count({ where: { externalId: block.externalId, ownerId: { in: owners } } })).resolves.toBe(2);
  });
});
