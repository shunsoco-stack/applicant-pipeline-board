"use client";

import Link from "next/link";
import { useState } from "react";
import { deadlineStatus } from "@/lib/deadlines";
import { boardStats } from "@/lib/stats";
import { STAGES } from "@/lib/types";
import { CandidateCard } from "./candidate-card";
import { useStore } from "./provider";
import { Empty, Heading } from "./ui";

export function Board() {
  const { database, now } = useStore();
  const [job, setJob] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tab, setTab] = useState<string>("応募");
  const stats = boardStats(database.candidates, now.date);
  const filtered = database.candidates.filter(
    (candidate) =>
      (!job || candidate.job === job) &&
      (!deadline ||
        (!candidate.outcome && deadlineStatus(candidate.deadline, now.date).key === deadline)),
  );
  return (
    <>
      <Heading
        eyebrow="PIPELINE / 採用の現在地"
        title="応募者を、待たせない。"
        description="次の連絡を、ひとつずつ。小さなチームのための採用進捗ボード。"
      >
        <Link className="button primary" href="/candidates#add">
          ＋ 応募者を追加
        </Link>
      </Heading>
      <div className="board-summary">
        <div>
          <span className="summary-icon navy">♧</span>
          <span>
            選考中
            <strong>
              {stats.active}
              <small>名</small>
            </strong>
          </span>
        </div>
        <Link href="/today">
          <span className="summary-icon rust">!</span>
          <span>
            連絡期限切れ
            <strong className="rust-text">
              {stats.overdue}
              <small>件</small>
            </strong>
          </span>
        </Link>
        <Link href="/today">
          <span className="summary-icon amber">◷</span>
          <span>
            今日までの連絡
            <strong>
              {stats.today}
              <small>件</small>
            </strong>
          </span>
        </Link>
        <div className="summary-note">
          <span>一通の連絡が、安心につながる。</span>
          <small>{now.date.replaceAll("-", ".")} · 日本時間</small>
        </div>
      </div>
      <div className="board-toolbar">
        <div className="filters">
          <label>
            職種
            <select value={job} onChange={(event) => setJob(event.target.value)}>
              <option value="">すべての職種</option>
              {database.settings.jobs.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            連絡期限
            <select value={deadline} onChange={(event) => setDeadline(event.target.value)}>
              <option value="">すべての期限</option>
              <option value="overdue">期限切れ</option>
              <option value="today">今日まで</option>
              <option value="soon">あと1日</option>
              <option value="safe">余裕あり</option>
            </select>
          </label>
        </div>
        <p className="helper">
          ● 連絡期限は営業日で設定 <span className="desktop-only">／ 操作はボタンで</span>
        </p>
      </div>
      <div className="stage-tabs" role="tablist" aria-label="段階">
        {STAGES.map((stage) => (
          <button
            key={stage}
            role="tab"
            aria-selected={tab === stage}
            onClick={() => setTab(stage)}
          >
            {stage}
            <small>
              {
                filtered.filter((candidate) => candidate.stage === stage && !candidate.outcome)
                  .length
              }
            </small>
          </button>
        ))}
      </div>
      <div className="board">
        {STAGES.map((stage, index) => {
          const candidates = filtered.filter(
            (candidate) => candidate.stage === stage && !candidate.outcome,
          );
          return (
            <section className={`board-column ${tab === stage ? "selected" : ""}`} key={stage}>
              <div className="column-heading">
                <h2>
                  <span className={`stage-dot stage-${index}`} />
                  {stage}
                  <span className="count">{candidates.length}</span>
                </h2>
                <span className="column-number">0{index + 1}</span>
              </div>
              <p className="column-subtitle">
                {
                  [
                    "はじめの一歩を、丁寧に",
                    "経験と可能性を知る",
                    "会って、お互いを知る",
                    "次の一歩を一緒に",
                  ][index]
                }
              </p>
              {candidates.map((candidate) => (
                <CandidateCard key={candidate.id} candidate={candidate} today={now.date} />
              ))}
              {!candidates.length && <Empty>該当する応募者はいません</Empty>}
            </section>
          );
        })}
      </div>
      <details className="ended">
        <summary>
          終了（辞退・見送り・内定承諾）
          <span>{filtered.filter((candidate) => candidate.outcome).length}名</span>
        </summary>
        <div className="card-grid">
          {filtered
            .filter((candidate) => candidate.outcome)
            .map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} today={now.date} />
            ))}
        </div>
      </details>
    </>
  );
}
