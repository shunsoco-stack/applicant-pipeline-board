import { splitCriteria } from "@/lib/scorecard";
import { CRITERIA, type Evaluation } from "@/lib/types";

export function EvaluationList({ evaluations }: { evaluations: Evaluation[] }) {
  const splits = splitCriteria(evaluations);
  if (!evaluations.length) return <p className="empty">まだ評価はありません。</p>;
  return (
    <>
      <p className="helper">2段階以上の差がある項目を朱色で表示します。</p>
      <div className="evaluation-grid">
        {evaluations.map((evaluation) => (
          <article className="evaluation" key={evaluation.interviewer}>
            <h3>
              {evaluation.interviewer}
              <small>{evaluation.at.date}</small>
            </h3>
            {CRITERIA.map((criterion, index) => (
              <div className={`score-row ${splits[index] ? "split-score" : ""}`} key={criterion}>
                <span>
                  {criterion}
                  {splits[index] && <small>評価に差あり</small>}
                </span>
                <strong>
                  {evaluation.scores[index]}
                  <small> / 4</small>
                </strong>
              </div>
            ))}
            <p>{evaluation.comment}</p>
            <span className="job-tag">{evaluation.decision}</span>
          </article>
        ))}
      </div>
    </>
  );
}
