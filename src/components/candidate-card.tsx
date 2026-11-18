import { stageDays, waitingDays } from "@/lib/deadlines";
import type { Candidate } from "@/lib/types";
import { CandidateActions } from "./candidate-actions";
import { CandidateLink, DeadlineBadge } from "./ui";

export function CandidateCard({ candidate, today }: { candidate: Candidate; today: string }) {
  return (
    <article
      className={`candidate-card ${!candidate.outcome && candidate.deadline < today ? "late-card" : ""}`}
    >
      <div className="card-top">
        <span className="job-tag">{candidate.job}</span>
        <span className="stage-age">{stageDays(candidate, today)}日目</span>
      </div>
      <CandidateLink id={candidate.id}>
        <h3>
          {candidate.name}
          <span>↗</span>
        </h3>
      </CandidateLink>
      <p className="source">{candidate.source}</p>
      <div className="contact-status">
        {!candidate.outcome && <DeadlineBadge deadline={candidate.deadline} today={today} />}
        <span>
          最終連絡から <strong>{waitingDays(candidate, today)}日</strong>
        </span>
      </div>
      {candidate.interview && !candidate.outcome && (
        <p className="interview-hint">
          面接 {candidate.interview.date.slice(5).replace("-", "/")} {candidate.interview.time}
        </p>
      )}
      <CandidateActions candidate={candidate} />
    </article>
  );
}
