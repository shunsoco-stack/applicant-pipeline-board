"use client";

import { addBusinessDays, previousMinute } from "@/lib/dates";
import type { Candidate } from "@/lib/types";
import { useStore } from "./provider";

export function CandidateForm({
  candidate,
  onSaved,
}: {
  candidate?: Candidate;
  onSaved?: () => void;
}) {
  const { database, update, updateCandidate, notify } = useStore();
  return (
    <form
      className="form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const name = String(values.get("name")).trim();
        if (!name) return;
        const basic = {
          name,
          job: String(values.get("job")),
          source: String(values.get("source")),
          email: String(values.get("email")),
          note: String(values.get("note")),
        };
        if (candidate) updateCandidate({ ...candidate, ...basic });
        else {
          const applied = previousMinute();
          update({
            ...database,
            candidates: [
              ...database.candidates,
              {
                ...basic,
                id: crypto.randomUUID(),
                applied,
                stage: "応募",
                history: [{ stage: "応募", entered: applied }],
                contacts: [],
                deadline: addBusinessDays(applied.date, database.settings.sla.応募),
                missed: false,
                evaluations: [],
              },
            ],
          });
          event.currentTarget.reset();
        }
        notify(candidate ? "基本情報を保存しました。" : "応募者を追加しました。");
        onSaved?.();
      }}
    >
      <label>
        氏名（必須）
        <input name="name" required maxLength={80} defaultValue={candidate?.name} />
      </label>
      <label>
        職種
        <select name="job" defaultValue={candidate?.job}>
          {[...new Set([...database.settings.jobs, ...(candidate ? [candidate.job] : [])])].map(
            (job) => (
              <option key={job}>{job}</option>
            ),
          )}
        </select>
      </label>
      <label>
        応募経路
        <select name="source" defaultValue={candidate?.source}>
          {["求人サイト", "社員紹介", "ハローワーク", "自社サイト", "その他"].map((source) => (
            <option key={source}>{source}</option>
          ))}
        </select>
      </label>
      <label>
        メールアドレス
        <input type="email" name="email" defaultValue={candidate?.email} />
      </label>
      <label className="full">
        メモ
        <textarea name="note" rows={3} maxLength={1000} defaultValue={candidate?.note} />
      </label>
      <button className="primary">{candidate ? "変更を保存" : "応募者を追加"}</button>
    </form>
  );
}
