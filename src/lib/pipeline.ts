import { addBusinessDays, stampValue } from "./dates";
import { hasMissed } from "./deadlines";
import {
  DECLINE_REASONS,
  REJECT_REASONS,
  STAGES,
  type Candidate,
  type Settings,
  type Stamp,
} from "./types";

function assertRecordable(candidate: Candidate, at: Stamp) {
  if (candidate.outcome) throw new Error("終了した応募者には記録できません。");
  const latest = [candidate.history.at(-1)!.entered, candidate.contacts.at(-1)?.at].filter(
    (stamp): stamp is Stamp => stamp !== undefined,
  );
  if (latest.some((stamp) => stampValue(at) < stampValue(stamp))) {
    throw new Error("記録日時は直前の履歴以降にしてください。");
  }
}

export function moveNext(candidate: Candidate, settings: Settings, at: Stamp): Candidate {
  assertRecordable(candidate, at);
  if (candidate.outcome) throw new Error("終了した応募者は移動できません。");
  if (stampValue(at) < stampValue(candidate.history.at(-1)!.entered))
    throw new Error("移動日時が不正です。");
  const index = STAGES.indexOf(candidate.stage);
  const history = candidate.history.map((entry, i) =>
    i === candidate.history.length - 1 ? { ...entry, exited: at } : entry,
  );
  if (index === 3)
    return {
      ...candidate,
      history,
      missed: hasMissed(candidate, at.date),
      outcome: {
        kind: "内定承諾",
        reason: "内定承諾",
        note: "承諾を確認",
        at,
        stage: candidate.stage,
      },
    };
  const stage = STAGES[index + 1];
  return {
    ...candidate,
    stage,
    history: [...history, { stage, entered: at }],
    missed: hasMissed(candidate, at.date),
    deadline: addBusinessDays(at.date, settings.sla[stage]),
  };
}

export function recordContact(
  candidate: Candidate,
  settings: Settings,
  at: Stamp,
  method: string,
  note: string,
): Candidate {
  assertRecordable(candidate, at);
  if (!method.trim()) throw new Error("連絡手段を選択してください。");
  if (!note.trim()) throw new Error("連絡内容を入力してください。");
  return {
    ...candidate,
    missed: hasMissed(candidate, at.date),
    contacts: [...candidate.contacts, { at, method, note: note.trim(), due: candidate.deadline }],
    deadline: addBusinessDays(at.date, settings.sla[candidate.stage]),
  };
}

export function closeCandidate(
  candidate: Candidate,
  kind: "辞退" | "見送り",
  reason: string,
  note: string,
  at: Stamp,
): Candidate {
  assertRecordable(candidate, at);
  const reasons: readonly string[] = kind === "辞退" ? DECLINE_REASONS : REJECT_REASONS;
  if (!reasons.includes(reason)) throw new Error("理由を選択してください。");
  if (candidate.outcome || !reason.trim() || !note.trim())
    throw new Error("理由とメモが必要です。");
  return {
    ...candidate,
    missed: hasMissed(candidate, at.date),
    history: candidate.history.map((entry, i) =>
      i === candidate.history.length - 1 ? { ...entry, exited: at } : entry,
    ),
    outcome: { kind, reason, note: note.trim(), at, stage: candidate.stage },
  };
}
