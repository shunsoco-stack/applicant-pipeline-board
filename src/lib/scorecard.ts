import type { Evaluation } from "./types";

export function splitCriteria(evaluations: Evaluation[]): boolean[] {
  return Array.from(
    { length: 5 },
    (_, index) =>
      evaluations.length > 1 &&
      Math.max(...evaluations.map((item) => item.scores[index])) -
        Math.min(...evaluations.map((item) => item.scores[index])) >=
        2,
  );
}

export function saveEvaluation(evaluations: Evaluation[], evaluation: Evaluation): Evaluation[] {
  if (
    evaluation.scores.length !== 5 ||
    evaluation.scores.some((score) => !Number.isInteger(score) || score < 1 || score > 4) ||
    !evaluation.comment.trim() ||
    !evaluation.interviewer.trim()
  )
    throw new Error("5項目の評価・面接官・コメントを入力してください。");
  return [...evaluations.filter((item) => item.interviewer !== evaluation.interviewer), evaluation];
}
