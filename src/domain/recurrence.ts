import { Quest } from "./types";

export function generateOccurrence(
  source: Quest,
  id: string,
  plannedStart: string,
  deadline: string
): Quest {
  return {
    ...source,
    id,
    plannedStart,
    deadline,
    carryoverCount: 0,
    status: "scheduled"
  };
}

