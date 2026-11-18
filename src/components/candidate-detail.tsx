"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { daysBetween, isBusinessDay } from "@/lib/dates";
import { CandidateActions } from "./candidate-actions";
import { CandidateForm } from "./candidate-form";
import { EvaluationList } from "./evaluation-list";
import { useStore } from "./provider";
import { DeadlineBadge, Heading } from "./ui";

export function useCandidate() {
  const { database } = useStore();
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();
  const id = params?.id ?? pathname.split("/")[2];
  return database.candidates.find((candidate) => candidate.id === id);
}

export function CandidateDetail() {
  const candidate = useCandidate();
  const { database, now, updateCandidate, notify } = useStore();
  if (!candidate)
    return (
      <section className="panel">
        <h1>応募者が見つかりません</h1>
        <p>このブラウザに保存された応募者IDをご確認ください。</p>
        <Link href="/candidates">応募者一覧へ</Link>
      </section>
    );
  return (
    <>
      <Heading
        eyebrow="CANDIDATE / 応募者詳細"
        title={candidate.name}
        description={`${candidate.job} · ${candidate.source} · 応募 ${candidate.applied.date}`}
      >
        <Link className="button" href={`/candidates/${candidate.id}/scorecard`} prefetch={false}>
          評価シートを開く →
        </Link>
      </Heading>
      <div className="detail-layout">
        <div>
          <section className="panel">
            <div className="section-title">
              <h2>
                現在の状況 <span className="job-tag">{candidate.stage}</span>
              </h2>
              {!candidate.outcome && (
                <DeadlineBadge deadline={candidate.deadline} today={now.date} />
              )}
            </div>
            <p>次の連絡期限：{candidate.deadline}</p>
            <CandidateActions candidate={candidate} />
            {candidate.outcome && (
              <p>
                {candidate.outcome.at.date} · {candidate.outcome.note}
              </p>
            )}
          </section>
          <section className="panel">
            <h2>基本情報</h2>
            <p>{candidate.email || "メールアドレス未登録"}</p>
            <p>{candidate.note || "メモはありません。"}</p>
            <details>
              <summary>基本情報を編集</summary>
              <CandidateForm candidate={candidate} />
            </details>
          </section>
          <section className="panel">
            <h2>段階の履歴</h2>
            <ol className="timeline">
              {candidate.history.map((entry, index) => (
                <li key={index}>
                  <strong>{entry.stage}</strong>
                  <span>
                    {entry.entered.date} {entry.entered.time} →{" "}
                    {entry.exited ? `${entry.exited.date} ${entry.exited.time}` : "現在"}
                  </span>
                  <small>
                    滞留 {daysBetween(entry.entered.date, entry.exited?.date ?? now.date)}日
                  </small>
                </li>
              ))}
            </ol>
          </section>
          <section className="panel">
            <h2>連絡記録</h2>
            {candidate.contacts.length ? (
              [...candidate.contacts].reverse().map((contact, index) => (
                <div className="contact-entry" key={index}>
                  <small>
                    {contact.at.date} {contact.at.time} · {contact.method}
                  </small>
                  <p>{contact.note}</p>
                  <small>
                    当時の期限：{contact.due}
                    {contact.at.date > contact.due ? " · 期限超過" : " · 期限内"}
                  </small>
                </div>
              ))
            ) : (
              <p>まだ連絡していません。</p>
            )}
          </section>
        </div>
        <div>
          <section className="panel">
            <h2>面接予定</h2>
            {candidate.interview && (
              <p>
                {candidate.interview.date} {candidate.interview.time}
                <br />
                {candidate.interview.interviewer}
              </p>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const values = new FormData(event.currentTarget);
                const date = String(values.get("date"));
                const time = String(values.get("time"));
                if (
                  !isBusinessDay(date) ||
                  time < "10:00" ||
                  time > "18:00" ||
                  `${date}T${time}` <= `${now.date}T${now.time}`
                ) {
                  notify("面接は未来の営業日、10:00〜18:00で設定してください。");
                  return;
                }
                updateCandidate({
                  ...candidate,
                  interview: { date, time, interviewer: String(values.get("interviewer")) },
                });
                notify("面接予定を保存しました。");
              }}
            >
              <label>
                面接日
                <input
                  type="date"
                  name="date"
                  required
                  min={now.date}
                  defaultValue={candidate.interview?.date}
                />
              </label>
              <label>
                時刻
                <input
                  type="time"
                  name="time"
                  required
                  min="10:00"
                  max="18:00"
                  defaultValue={candidate.interview?.time ?? "14:00"}
                />
              </label>
              <label>
                面接官
                <select name="interviewer" defaultValue={candidate.interview?.interviewer}>
                  {database.settings.interviewers.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
              <button className="primary">予定を保存</button>
              {candidate.interview && (
                <button
                  type="button"
                  onClick={() => {
                    updateCandidate({ ...candidate, interview: undefined });
                    notify("面接予定を取り消しました。");
                  }}
                >
                  予定を取り消す
                </button>
              )}
            </form>
          </section>
        </div>
      </div>
      <section className="panel">
        <h2>面接評価シート</h2>
        <EvaluationList evaluations={candidate.evaluations} />
      </section>
    </>
  );
}
