import { expect, it } from "vitest";
import { quest } from "@/test/factories";
import { generateOccurrence } from "./recurrence";

it("creates an independent occurrence without changing the earlier quest", () => {
  const earlier = quest({ id: "original", carryoverCount: 2, status: "due_today" });
  const next = generateOccurrence(
    earlier,
    "next-id",
    "2026-06-02T09:00:00+09:00",
    "2026-06-02T18:00:00+09:00"
  );

  expect(next).toMatchObject({
    id: "next-id",
    plannedStart: "2026-06-02T09:00:00+09:00",
    deadline: "2026-06-02T18:00:00+09:00",
    carryoverCount: 0,
    status: "scheduled"
  });
  expect(earlier).toMatchObject({
    id: "original",
    carryoverCount: 2,
    status: "due_today"
  });
});

