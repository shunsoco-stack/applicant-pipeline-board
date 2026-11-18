"use client";

import { useState } from "react";
import { previousMinute } from "@/lib/dates";
import { closeCandidate, moveNext, recordContact } from "@/lib/pipeline";
import { DECLINE_REASONS, REJECT_REASONS, type Candidate } from "@/lib/types";
import { useStore } from "./provider";
import { Dialog } from "./dialog";

export function CandidateActions({ candidate }: { candidate: Candidate }) {
  const { database, updateCandidate, notify } = useStore();
  const [action, setAction] = useState<"連絡" | "辞退" | "見送り" | null>(null);
  if (candidate.outcome)
    return (
      <span className="outcome-label">
        {candidate.outcome.kind} · {candidate.outcome.reason}
      </span>
    );
  return (
    <>
      <div className="card-actions">
        <button
          onClick={() => {
            updateCandidate(moveNext(candidate, database.settings, previousMinute()));
            notify(
              candidate.stage === "内定" ? "内定承諾を記録しました。" : "次の段階へ移動しました。",
            );
          }}
          className="next-button"
        >
          {candidate.stage === "内定" ? "承諾を記録" : "次の段階へ"}
          <span>→</span>
        </button>
        <button onClick={() => setAction("連絡")}>連絡した</button>
      </div>
      <div className="quiet-actions">
        <button onClick={() => setAction("辞退")}>辞退</button>
        <button onClick={() => setAction("見送り")}>見送り</button>
      </div>
      {action && (
        <Dialog title={`${action}を記録`} onClose={() => setAction(null)}>
          <h2>{action}を記録</h2>
          <p>{candidate.name}さん</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const note = String(form.get("note")).trim();
              if (!note) return;
              const at = previousMinute();
              updateCandidate(
                action === "連絡"
                  ? recordContact(
                      candidate,
                      database.settings,
                      at,
                      String(form.get("reason")),
                      note,
                    )
                  : closeCandidate(candidate, action, String(form.get("reason")), note, at),
              );
              notify(`${action}を記録しました。`);
              setAction(null);
            }}
          >
            <label>
              {action === "連絡" ? "連絡手段" : "理由（必須）"}
              <select name="reason" required autoFocus>
                {(action === "連絡"
                  ? ["メール", "電話", "対面", "オンライン"]
                  : action === "辞退"
                    ? DECLINE_REASONS
                    : REJECT_REASONS
                ).map((reason) => (
                  <option key={reason}>{reason}</option>
                ))}
              </select>
            </label>
            <label>
              {action === "連絡" ? "連絡内容" : "理由のメモ"}（必須）
              <textarea name="note" required maxLength={500} rows={4} />
            </label>
            <p className="helper">
              {action === "連絡"
                ? "記録すると、この段階の営業日数で次の連絡期限を更新します。"
                : "選考を終了し、振り返りの集計に反映します。"}
            </p>
            <div className="button-row">
              <button type="button" onClick={() => setAction(null)}>
                キャンセル
              </button>
              <button className="primary">記録する</button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
