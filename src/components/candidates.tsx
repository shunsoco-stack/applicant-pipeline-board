"use client";

import { useState } from "react";
import { candidateCsv, csvFilename, download } from "@/lib/csv";
import { CandidateForm } from "./candidate-form";
import { useStore } from "./provider";
import { CandidateLink, DeadlineBadge, Empty, Heading } from "./ui";

export function Candidates() {
  const { database, now } = useStore();
  const [search, setSearch] = useState("");
  const candidates = database.candidates.filter((candidate) =>
    `${candidate.name}${candidate.job}${candidate.source}`.includes(search),
  );
  return (
    <>
      <Heading
        eyebrow="CANDIDATES"
        title="応募者一覧"
        description="ひとりひとりの情報と、いまの進捗を。"
      >
        <button onClick={() => download(candidateCsv(candidates), csvFilename(now.date))}>
          ↓ CSVをダウンロード
        </button>
      </Heading>
      <label className="search-field">
        応募者を検索
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="氏名・職種・応募経路"
        />
      </label>
      <div className="panel candidate-table">
        <table>
          <thead>
            <tr>
              <th>氏名 / 応募職種</th>
              <th>応募経路</th>
              <th>応募日</th>
              <th>段階</th>
              <th>連絡期限 / 結果</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.id}>
                <td>
                  <CandidateLink id={candidate.id}>
                    <strong>{candidate.name}</strong>
                  </CandidateLink>
                  <small>{candidate.job}</small>
                </td>
                <td>{candidate.source}</td>
                <td>{candidate.applied.date}</td>
                <td>{candidate.stage}</td>
                <td>
                  {candidate.outcome?.kind ?? (
                    <DeadlineBadge deadline={candidate.deadline} today={now.date} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!candidates.length && <Empty>検索条件に一致する応募者はいません。</Empty>}
      </div>
      <section className="panel" id="add">
        <h2>新しい応募者を追加</h2>
        <CandidateForm />
      </section>
    </>
  );
}
