import { stampValue } from "./dates";
import { DECLINE_REASONS, REJECT_REASONS, STAGES, type Candidate, type Database } from "./types";

function consistentCandidate(candidate: Candidate): boolean {
  const history = candidate.history;
  if (history.length !== STAGES.indexOf(candidate.stage) + 1) return false;
  if (stampValue(history[0].entered) !== stampValue(candidate.applied)) return false;
  if (
    !history.every((entry, index) => {
      if (entry.stage !== STAGES[index]) return false;
      if (entry.exited && stampValue(entry.exited) < stampValue(entry.entered)) return false;
      const next = history[index + 1];
      return (
        !next ||
        (entry.exited !== undefined && stampValue(entry.exited) === stampValue(next.entered))
      );
    })
  )
    return false;
  const last = history[history.length - 1];
  const outcome = candidate.outcome;
  if (outcome) {
    if (
      outcome.stage !== candidate.stage ||
      !last.exited ||
      stampValue(last.exited) !== stampValue(outcome.at)
    )
      return false;
    const reasons: readonly string[] =
      outcome.kind === "辞退"
        ? DECLINE_REASONS
        : outcome.kind === "見送り"
          ? REJECT_REASONS
          : ["内定承諾"];
    if (
      !reasons.includes(outcome.reason) ||
      (outcome.kind === "内定承諾" && candidate.stage !== "内定")
    )
      return false;
  } else if (last.exited) return false;
  if (
    new Set(candidate.evaluations.map((entry) => entry.interviewer)).size !==
    candidate.evaluations.length
  )
    return false;
  return (
    candidate.contacts.every((entry, index) => {
      const previous = candidate.contacts[index - 1]?.at ?? candidate.applied;
      return (
        stampValue(entry.at) >= stampValue(previous) &&
        (!outcome || stampValue(entry.at) <= stampValue(outcome.at))
      );
    }) &&
    candidate.evaluations.every((entry) => stampValue(entry.at) >= stampValue(candidate.applied))
  );
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 10000;
}

function date(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

function stamp(value: unknown): boolean {
  return (
    object(value) &&
    date(value.date) &&
    typeof value.time === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)
  );
}

function stage(value: unknown): boolean {
  return STAGES.includes(value as (typeof STAGES)[number]);
}

export function validateDatabase(value: unknown): value is Database {
  if (
    !object(value) ||
    value.version !== 1 ||
    !object(value.settings) ||
    !Array.isArray(value.candidates) ||
    value.candidates.length > 10000
  )
    return false;
  const settings = value.settings;
  if (
    ![settings.jobs, settings.interviewers].every(
      (list) =>
        Array.isArray(list) &&
        list.length > 0 &&
        list.length <= 100 &&
        list.every(text) &&
        new Set(list).size === list.length,
    ) ||
    !object(settings.sla)
  )
    return false;
  if (
    !STAGES.every(
      (key) =>
        Number.isInteger((settings.sla as Record<string, unknown>)[key]) &&
        Number((settings.sla as Record<string, unknown>)[key]) >= 1 &&
        Number((settings.sla as Record<string, unknown>)[key]) <= 30,
    )
  )
    return false;
  const ids = new Set();
  return value.candidates.every((candidate) => {
    if (
      !object(candidate) ||
      !text(candidate.id) ||
      !/^[a-zA-Z0-9_-]+$/.test(candidate.id) ||
      ids.has(candidate.id)
    )
      return false;
    ids.add(candidate.id);
    if (
      ![candidate.name, candidate.job, candidate.source].every(text) ||
      typeof candidate.email !== "string" ||
      typeof candidate.note !== "string" ||
      !stamp(candidate.applied) ||
      !stage(candidate.stage) ||
      !date(candidate.deadline) ||
      typeof candidate.missed !== "boolean"
    )
      return false;
    if (
      !Array.isArray(candidate.history) ||
      !candidate.history.length ||
      !candidate.history.every(
        (entry) =>
          object(entry) &&
          stage(entry.stage) &&
          stamp(entry.entered) &&
          (entry.exited === undefined || stamp(entry.exited)),
      )
    )
      return false;
    if (
      !Array.isArray(candidate.contacts) ||
      !candidate.contacts.every(
        (entry) =>
          object(entry) &&
          stamp(entry.at) &&
          text(entry.method) &&
          text(entry.note) &&
          date(entry.due),
      )
    )
      return false;
    if (
      !Array.isArray(candidate.evaluations) ||
      !candidate.evaluations.every(
        (entry) =>
          object(entry) &&
          text(entry.interviewer) &&
          text(entry.comment) &&
          stamp(entry.at) &&
          ["次に進める", "保留", "見送り"].includes(String(entry.decision)) &&
          Array.isArray(entry.scores) &&
          entry.scores.length === 5 &&
          entry.scores.every((score) => Number.isInteger(score) && score >= 1 && score <= 4),
      )
    )
      return false;
    if (
      candidate.interview !== undefined &&
      (!object(candidate.interview) ||
        !stamp(candidate.interview) ||
        !text(candidate.interview.interviewer))
    )
      return false;
    if (
      candidate.outcome !== undefined &&
      (!object(candidate.outcome) ||
        !["辞退", "見送り", "内定承諾"].includes(String(candidate.outcome.kind)) ||
        !text(candidate.outcome.reason) ||
        !text(candidate.outcome.note) ||
        !stamp(candidate.outcome.at) ||
        !stage(candidate.outcome.stage))
    )
      return false;
    return consistentCandidate(candidate as unknown as Candidate);
  });
}

export function parseBackup(json: string): Database {
  const value: unknown = JSON.parse(json);
  if (!validateDatabase(value))
    throw new Error("形式が正しくないため読み込めません。現在のデータは変更していません。");
  return value;
}

export function exportBackup(database: Database): string {
  if (!validateDatabase(database)) throw new Error("保存データが不正です。");
  return JSON.stringify(database, null, 2);
}
