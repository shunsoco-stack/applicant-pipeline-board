import { addBusinessDays, isBusinessDay, japanNow, shiftDays } from "./dates";
import { APPLICANT_NOTES, CONTACT_NOTES, NAMES } from "./seed-data";
import { applicationStamps, applicationSources } from "./seed-variety";
import { EVALUATION_NOTES, SECOND_OPINIONS, SEED_OUTCOMES } from "./seed-outcomes";
import { STAGES, type Candidate, type Database, type Stage } from "./types";

export function createSeed(now = new Date()): Database {
  const today = japanNow(now).date;
  const applications = applicationStamps(today);
  const sources = applicationSources();
  const settings: Database["settings"] = {
    jobs: ["ルート営業", "経理事務", "倉庫リーダー"],
    interviewers: ["小野 真理", "大野 俊介", "岸本 由紀", "西田 誠一", "藤野 杏奈"],
    sla: { 応募: 2, 書類選考: 2, 面接: 3, 内定: 5 },
  };
  const candidates = NAMES.map((name, index): Candidate => {
    const active = index < 14;
    const stageIndex = active
      ? index < 2
        ? 0
        : index < 5
          ? 1
          : index < 12
            ? 2
            : 3
      : index < 17
        ? 3
        : (index % 3) + 1;
    const stage = STAGES[stageIndex];
    const applied = applications[index];
    const lastDate = shiftDays(today, -(active ? 2 + (index % 4) : 8 + (index % 15)));
    const at = { date: lastDate, time: `${10 + (index % 7)}:${index % 2 ? "15" : "40"}` };
    const missed = index >= 14 && index < 34;
    const history = STAGES.slice(0, stageIndex + 1).map((historyStage, historyIndex) => ({
      stage: historyStage,
      entered:
        historyIndex === 0
          ? applied
          : { date: shiftDays(applied.date, historyIndex * 2), time: "11:20" },
      ...(historyIndex < stageIndex
        ? { exited: { date: shiftDays(applied.date, (historyIndex + 1) * 2), time: "11:20" } }
        : {}),
    }));
    const candidate: Candidate = {
      id: `minato-${index + 1}`,
      name,
      job: settings.jobs[index % 3],
      source: sources[index],
      email: `candidate${index + 1}@example.com`,
      note: APPLICANT_NOTES[index] ?? "",
      applied,
      stage,
      history,
      contacts: [
        {
          at,
          method: index % 3 === 0 ? "電話" : "メール",
          note: CONTACT_NOTES[index],
          due: missed ? shiftDays(lastDate, -2) : addBusinessDays(lastDate, 1),
        },
      ],
      deadline: active
        ? index < 3
          ? shiftDays(today, -(index + 1))
          : index < 5
            ? today
            : index === 5
              ? shiftDays(today, 1)
              : addBusinessDays(today, 2 + (index % 3))
        : addBusinessDays(lastDate, 3),
      missed,
      evaluations: [],
    };
    if (stageIndex >= 2) {
      candidate.evaluations = Array.from({ length: index % 3 === 0 ? 2 : 1 }, (_, reviewer) => ({
        interviewer: settings.interviewers[reviewer],
        scores: [
          index === 6 || index === 9 || index === 12 ? (reviewer ? 4 : 2) : 3,
          2 + (index % 3),
          3,
          reviewer ? 4 : 3,
          3,
        ],
        comment: reviewer ? SECOND_OPINIONS[index] : EVALUATION_NOTES[index - 5],
        decision: "次に進める",
        at: { date: lastDate, time: reviewer ? "17:30" : "17:10" },
      }));
    }
    if (active && stage === "面接") {
      let date = shiftDays(today, index <= 6 ? 1 : 3 + (index % 4));
      // 直近2件は休日にも翌日のデモ予定を置く。他の面接は営業日に調整する。
      while (index > 6 && !isBusinessDay(date)) date = shiftDays(date, 1);
      candidate.interview = {
        date,
        time: index % 2 ? "14:00" : "16:00",
        interviewer: settings.interviewers[index % 5],
      };
    }
    if (!active) {
      const [kind, reason, note] = SEED_OUTCOMES[index - 14];
      candidate.outcome = {
        kind,
        reason,
        note,
        at: { date: lastDate, time: "18:10" },
        stage: stage as Stage,
      };
      candidate.history[candidate.history.length - 1].exited = candidate.outcome.at;
    }
    return candidate;
  });
  return { version: 1, settings, candidates };
}
