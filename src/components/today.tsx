"use client";

import { shiftDays } from "@/lib/dates";
import { CandidateCard } from "./candidate-card";
import { useStore } from "./provider";
import { CandidateLink, Empty, Heading } from "./ui";

export function Today() {
  const { database, now } = useStore();
  const contacts = database.candidates
    .filter((candidate) => !candidate.outcome && candidate.deadline <= now.date)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  const interviews = database.candidates
    .filter(
      (candidate) =>
        !candidate.outcome &&
        candidate.interview &&
        [now.date, shiftDays(now.date, 1)].includes(candidate.interview.date),
    )
    .sort((a, b) =>
      `${a.interview!.date}${a.interview!.time}`.localeCompare(
        `${b.interview!.date}${b.interview!.time}`,
      ),
    );
  return (
    <>
      <Heading
        eyebrow="TODAY"
        title="今日やること"
        description={`${now.date} · まずは、連絡を待っている方から。`}
      />
      <section>
        <h2>
          期限切れ・今日までの連絡 <span className="count">{contacts.length}</span>
        </h2>
        <div className="card-grid">
          {contacts.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} today={now.date} />
          ))}
        </div>
        {!contacts.length && <Empty>今日までの連絡はすべて完了しています。</Empty>}
      </section>
      <section className="panel">
        <h2>
          今日・明日の面接 <span className="count">{interviews.length}</span>
        </h2>
        {interviews.map((candidate) => (
          <div key={candidate.id} className="interview-row">
            <strong>
              {candidate.interview!.date === now.date ? "今日" : "明日"} {candidate.interview!.time}
            </strong>
            <CandidateLink id={candidate.id}>{candidate.name}</CandidateLink>
            <span>
              {candidate.job} / {candidate.interview!.interviewer}
            </span>
          </div>
        ))}
        {!interviews.length && <Empty>今日・明日の面接予定はありません。</Empty>}
      </section>
    </>
  );
}
