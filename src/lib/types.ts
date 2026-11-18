export const STAGES = ["応募", "書類選考", "面接", "内定"] as const;

export type Stage = (typeof STAGES)[number];

export const DECLINE_REASONS = [
  "他社内定",
  "条件",
  "勤務地",
  "選考が遅い",
  "連絡が遅い",
  "面接の印象",
  "家庭の事情",
  "その他",
] as const;

export const REJECT_REASONS = [
  "経験・スキル",
  "勤務条件",
  "職務理解",
  "募集枠充足",
  "その他",
] as const;

export const CRITERIA = [
  "仕事への理解",
  "経験・スキル",
  "コミュニケーション",
  "主体性",
  "職場との相性",
] as const;

export type Stamp = { date: string; time: string };

export type Evaluation = {
  interviewer: string;
  scores: number[];
  comment: string;
  decision: "次に進める" | "保留" | "見送り";
  at: Stamp;
};

export type Candidate = {
  id: string;
  name: string;
  job: string;
  source: string;
  email: string;
  note: string;
  applied: Stamp;
  stage: Stage;
  history: { stage: Stage; entered: Stamp; exited?: Stamp }[];
  contacts: { at: Stamp; method: string; note: string; due: string }[];
  deadline: string;
  missed: boolean;
  interview?: { date: string; time: string; interviewer: string };
  evaluations: Evaluation[];
  outcome?: {
    kind: "辞退" | "見送り" | "内定承諾";
    reason: string;
    note: string;
    at: Stamp;
    stage: Stage;
  };
};

export type Settings = { jobs: string[]; interviewers: string[]; sla: Record<Stage, number> };

export type Database = { version: 1; candidates: Candidate[]; settings: Settings };
