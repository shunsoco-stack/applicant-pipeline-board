"use client";

import { useState } from "react";
import { previousMinute } from "@/lib/dates";
import { saveEvaluation } from "@/lib/scorecard";
import { CRITERIA, type Candidate, type Evaluation } from "@/lib/types";
import { useCandidate } from "./candidate-detail";
import { EvaluationList } from "./evaluation-list";
import { useStore } from "./provider";
import { Heading } from "./ui";

function ScoreForm({ candidate }: { candidate: Candidate }) {
  const { database, updateCandidate, notify } = useStore();
  const [interviewer, setInterviewer] = useState(database.settings.interviewers[0]);
  const saved = candidate.evaluations.find((evaluation) => evaluation.interviewer === interviewer);
  return (
    <div className="score-sheet">
      <div className="sheet-top">
        <span>みなと通商（架空）</span>
        <span>INTERVIEW SCORECARD</span>
      </div>
      <h2>面接評価シート</h2>
      <p>
        {candidate.name} さん / {candidate.job}
      </p>
      <label>
        面接官
        <select value={interviewer} onChange={(event) => setInterviewer(event.target.value)}>
          {[
            ...new Set([
              ...database.settings.interviewers,
              ...candidate.evaluations.map((evaluation) => evaluation.interviewer),
            ]),
          ].map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <form
        key={interviewer}
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          const evaluation: Evaluation = {
            interviewer,
            scores: CRITERIA.map((_, index) => Number(values.get(`score-${index}`))),
            comment: String(values.get("comment")).trim(),
            decision: String(values.get("decision")) as Evaluation["decision"],
            at: previousMinute(),
          };
          try {
            updateCandidate({
              ...candidate,
              evaluations: saveEvaluation(candidate.evaluations, evaluation),
            });
            notify("面接評価を保存しました。");
          } catch (error) {
            notify((error as Error).message);
          }
        }}
      >
        <p className="helper">1：不足　2：やや不足　3：満たす　4：優れている</p>
        {CRITERIA.map((criterion, index) => (
          <fieldset className="rating-field" key={criterion}>
            <legend>
              {index + 1}. {criterion}
            </legend>
            <div>
              {[1, 2, 3, 4].map((score) => (
                <label key={score}>
                  <input
                    type="radio"
                    name={`score-${index}`}
                    value={score}
                    required
                    defaultChecked={saved?.scores[index] === score}
                  />
                  <span>{score}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <label>
          一言コメント（必須）
          <textarea
            name="comment"
            rows={3}
            required
            maxLength={300}
            defaultValue={saved?.comment}
          />
        </label>
        <label>
          総合評価
          <select name="decision" defaultValue={saved?.decision ?? "保留"}>
            {["次に進める", "保留", "見送り"].map((decision) => (
              <option key={decision}>{decision}</option>
            ))}
          </select>
        </label>
        <div className="button-row no-print">
          <button className="primary">評価を保存</button>
          <button type="button" onClick={() => window.print()}>
            印刷 / PDF
          </button>
        </div>
        <p className="helper no-print">
          同じ面接官で保存すると、その面接官の評価を更新します。印刷前に保存してください。
        </p>
      </form>
    </div>
  );
}

export function Scorecard() {
  const candidate = useCandidate();
  if (!candidate) return <p>応募者が見つかりません。</p>;
  return (
    <>
      <div className="no-print">
        <Heading
          eyebrow="INTERVIEW"
          title="その場で、評価をひとつに。"
          description="5つの観点と一言で、面接の気づきを残しましょう。"
        />
      </div>
      <ScoreForm candidate={candidate} />
      <section className="panel no-print">
        <h2>面接官の評価を比較</h2>
        <EvaluationList evaluations={candidate.evaluations} />
      </section>
    </>
  );
}
