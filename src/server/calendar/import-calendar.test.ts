import { expect, it } from "vitest";
import { importCalendar } from "./import-calendar";

it("imports fixed blocks through a read-only calendar source", async () => {
  const source = {
    listEvents: async () => [
      {
        externalId: "meeting",
        title: "Meeting",
        start: "2026-06-01T09:00:00+09:00",
        end: "2026-06-01T10:00:00+09:00"
      }
    ]
  };

  await expect(importCalendar(source, "2026-06-01", "2026-06-07")).resolves.toHaveLength(1);
});

