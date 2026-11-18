"use client";

import { STAGES } from "@/lib/types";
import { useStore } from "./provider";
import { Heading } from "./ui";

export function SettingsPage() {
  const { database, update, notify } = useStore();
  return (
    <>
      <Heading
        eyebrow="SETTINGS"
        title="チームに合った、連絡のペースを。"
        description="営業日数・面接官・職種を設定します。"
      />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          const lines = (key: string) => [
            ...new Set(
              String(values.get(key))
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            ),
          ];
          const jobs = lines("jobs");
          const interviewers = lines("interviewers");
          if (
            !jobs.length ||
            !interviewers.length ||
            jobs.length > 100 ||
            interviewers.length > 100
          ) {
            notify("職種・面接官はそれぞれ1〜100件で入力してください。");
            return;
          }
          update({
            ...database,
            settings: {
              jobs,
              interviewers,
              sla: {
                応募: Number(values.get("応募")),
                書類選考: Number(values.get("書類選考")),
                面接: Number(values.get("面接")),
                内定: Number(values.get("内定")),
              },
            },
          });
          notify("設定を保存しました。次の段階移動・連絡記録から新しい営業日数を使います。");
        }}
      >
        <section className="panel">
          <h2>次の連絡までの営業日数</h2>
          <p className="helper">
            既存の連絡期限は維持します。変更後の段階移動・連絡記録に適用します。
          </p>
          <div className="form-grid">
            {STAGES.map((stage) => (
              <label key={stage}>
                {stage}
                <input
                  type="number"
                  name={stage}
                  required
                  min={1}
                  max={30}
                  defaultValue={database.settings.sla[stage]}
                />
              </label>
            ))}
          </div>
        </section>
        <div className="two-columns">
          <section className="panel">
            <h2>面接官</h2>
            <label>
              1行に1名
              <textarea
                name="interviewers"
                rows={6}
                maxLength={1000}
                required
                defaultValue={database.settings.interviewers.join("\n")}
              />
            </label>
          </section>
          <section className="panel">
            <h2>職種</h2>
            <label>
              1行に1職種
              <textarea
                name="jobs"
                rows={6}
                maxLength={1000}
                required
                defaultValue={database.settings.jobs.join("\n")}
              />
            </label>
            <p className="helper">
              名称を変更しても既存応募者の職種や過去の評価者名は変わりません。
            </p>
          </section>
        </div>
        <button className="primary">設定を保存</button>
      </form>
    </>
  );
}
