import { deadlineStatus } from "./deadlines";
import type { Candidate } from "./types";

export function boardStats(candidates: Candidate[], today: string) {
  const active = candidates.filter((candidate) => !candidate.outcome);
  return {
    active: active.length,
    overdue: active.filter(
      (candidate) => deadlineStatus(candidate.deadline, today).key === "overdue",
    ).length,
    today: active.filter((candidate) => candidate.deadline === today).length,
  };
}
