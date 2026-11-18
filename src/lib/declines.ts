import { daysBetween } from "./dates";
import { hasMissed } from "./deadlines";
import { STAGES, type Candidate } from "./types";

export function rate(candidates: Candidate[]) {
  const declined = candidates.filter((candidate) => candidate.outcome?.kind === "辞退").length;
  return {
    total: candidates.length,
    declined,
    percent: candidates.length ? (declined / candidates.length) * 100 : 0,
  };
}

export function summarize(candidates: Candidate[], start: string, end: string, today: string) {
  const cohort = candidates.filter(
    (candidate) => candidate.applied.date >= start && candidate.applied.date <= end,
  );
  const ended = candidates.filter(
    (candidate) =>
      candidate.outcome && candidate.outcome.at.date >= start && candidate.outcome.at.date <= end,
  );
  const declines = ended.filter((candidate) => candidate.outcome?.kind === "辞退");
  const reasons = (kind: "辞退" | "見送り") => {
    const rows = ended.filter((candidate) => candidate.outcome?.kind === kind);
    return [...new Set(rows.map((candidate) => candidate.outcome!.reason))]
      .map((reason) => ({
        reason,
        count: rows.filter((candidate) => candidate.outcome!.reason === reason).length,
        percent:
          (rows.filter((candidate) => candidate.outcome!.reason === reason).length / rows.length) *
          100,
      }))
      .sort((a, b) => b.count - a.count);
  };
  return {
    ended,
    declines,
    reasons,
    averageDays: declines.length
      ? declines.reduce(
          (sum, candidate) => sum + daysBetween(candidate.applied.date, candidate.outcome!.at.date),
          0,
        ) / declines.length
      : 0,
    stages: STAGES.map((stage) => ({
      stage,
      count: declines.filter((candidate) => candidate.outcome!.stage === stage).length,
    })),
    cross: reasons("辞退").map((row) => ({
      reason: row.reason,
      counts: STAGES.map(
        (stage) =>
          declines.filter(
            (candidate) =>
              candidate.outcome!.stage === stage && candidate.outcome!.reason === row.reason,
          ).length,
      ),
      averageDays:
        declines
          .filter((candidate) => candidate.outcome!.reason === row.reason)
          .reduce(
            (sum, candidate) =>
              sum + daysBetween(candidate.applied.date, candidate.outcome!.at.date),
            0,
          ) / row.count,
    })),
    compliant: rate(cohort.filter((candidate) => !hasMissed(candidate, today))),
    missed: rate(cohort.filter((candidate) => hasMissed(candidate, today))),
    jobs: [...new Set(cohort.map((candidate) => candidate.job))].map((job) => ({
      job,
      ...rate(cohort.filter((candidate) => candidate.job === job)),
    })),
  };
}
