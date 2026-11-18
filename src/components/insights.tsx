"use client";

import { useState } from "react";
import { shiftDays } from "@/lib/dates";
import { summarize } from "@/lib/declines";
import { candidateCsv, csvFilename, download } from "@/lib/csv";
import { STAGES } from "@/lib/types";
import { useStore } from "./provider";
import { Empty, Heading } from "./ui";

export function Insights() {
  const { database, now } = useStore();
  const [start, setStart] = useState(shiftDays(now.date, -120));
  const [end, setEnd] = useState(now.date);
  const stats = summarize(database.candidates, start, end, now.date);
  return (
    <>
      <Heading
        eyebrow="REFLECTION"
        title="辞退の理由に、次のヒントを。"
        description="数字の向こうにある、応募者の声を振り返ります。"
      >
        <button
          disabled={start > end}
          onClick={() =>
            download(
              candidateCsv(
                stats.ended.filter((candidate) => candidate.outcome?.kind !== "内定承諾"),
              ),
              csvFilename(now.date, start, end),
            )
          }
        >
          ↓ 辞退・見送りCSV
        </button>
      </Heading>
      <div className="filters panel">
        <label>
          開始日
          <input
            type="date"
            value={start}
            required
            onChange={(event) => event.target.value && setStart(event.target.value)}
          />
        </label>
        <span>〜</span>
        <label>
          終了日
          <input
            type="date"
            value={end}
            required
            onChange={(event) => event.target.value && setEnd(event.target.value)}
          />
        </label>
      </div>
      {start > end ? (
        <Empty>終了日は開始日以降にしてください。</Empty>
      ) : (
        <>
          <section className="panel comparison">
            <p className="eyebrow">連絡の速さと、辞退の関係</p>
            <h2>連絡期限を守れたかどうかで比較</h2>
            <div className="comparison-grid">
              {[
                ["期限を守れた応募者", stats.compliant],
                ["期限を守れなかった応募者", stats.missed],
              ].map(([title, value]) => {
                const group = value as typeof stats.compliant;
                return (
                  <div key={String(title)}>
                    <h3>{String(title)}</h3>
                    <strong className="big-number">
                      {group.total ? group.percent.toFixed(1) : "—"}
                      <small>%</small>
                    </strong>
                    <p>
                      辞退 {group.declined}名 / 応募 {group.total}名
                    </p>
                    <div className="bar-track">
                      <span style={{ width: `${group.percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="helper">
              期間内に応募した全員が分母です（選考中・内定承諾を含む）。期限超過の履歴または現在の期限切れを未遵守とします。応募時期や職種などの影響があるため、因果関係を示す数字ではありません。
            </p>
          </section>
          <div className="two-columns">
            {(["辞退", "見送り"] as const).map((kind) => (
              <section className="panel" key={kind}>
                <h2>{kind}理由</h2>
                <p className="helper">期間内の{kind}者に占める割合</p>
                {stats.reasons(kind).map((row) => (
                  <div className="reason-row" key={row.reason}>
                    <div>
                      <span>{row.reason}</span>
                      <strong>
                        {row.count}名 <small>{row.percent.toFixed(0)}%</small>
                      </strong>
                    </div>
                    <div className="bar-track">
                      <span style={{ width: `${row.percent}%` }} />
                    </div>
                  </div>
                ))}
                {!stats.reasons(kind).length && <Empty>この期間の記録はありません。</Empty>}
              </section>
            ))}
          </div>
          <div className="two-columns">
            <section className="panel">
              <h2>辞退が起きた段階</h2>
              {stats.stages.map((row) => (
                <div className="score-row" key={row.stage}>
                  <span>{row.stage}</span>
                  <strong>{row.count}名</strong>
                </div>
              ))}
            </section>
            <section className="panel">
              <h2>応募から辞退まで</h2>
              <strong className="big-number">
                {stats.declines.length ? stats.averageDays.toFixed(1) : "—"}
                <small>日</small>
              </strong>
              <p>期間内の辞退者 {stats.declines.length}名の平均（暦日）</p>
            </section>
          </div>
          <section className="panel">
            <h2>理由 × 段階・辞退までの日数</h2>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>理由</th>
                    {STAGES.map((stage) => (
                      <th key={stage}>{stage}</th>
                    ))}
                    <th>平均日数</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.cross.map((row) => (
                    <tr key={row.reason}>
                      <td>{row.reason}</td>
                      {row.counts.map((count, index) => (
                        <td key={index}>{count}</td>
                      ))}
                      <td>{row.averageDays.toFixed(1)}日</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel">
            <h2>職種別の辞退率</h2>
            <p className="helper">期間内の応募者を分母に集計</p>
            {stats.jobs.map((row) => (
              <div className="score-row" key={row.job}>
                <span>{row.job}</span>
                <strong>
                  {row.percent.toFixed(1)}%{" "}
                  <small>
                    （{row.declined}/{row.total}名）
                  </small>
                </strong>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  );
}
