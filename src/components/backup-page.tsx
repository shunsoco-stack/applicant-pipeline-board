"use client";

import { useState } from "react";
import { exportBackup, parseBackup } from "@/lib/backup";
import { download } from "@/lib/csv";
import type { Database } from "@/lib/types";
import { useStore } from "./provider";
import { Heading } from "./ui";

export function BackupPage() {
  const { database, now, update, notify } = useStore();
  const [pending, setPending] = useState<Database | null>(null);
  return (
    <>
      <Heading
        eyebrow="BACKUP"
        title="大切な記録を、手元にも。"
        description="このブラウザのデータをJSONファイルで保存・復元できます。"
      />
      <section className="panel">
        <h2>バックアップを保存</h2>
        <p>応募者・連絡記録・評価シート・設定をまとめて保存します。</p>
        <button
          className="primary"
          onClick={() =>
            download(exportBackup(database), `採用ボード_${now.date}.json`, "application/json")
          }
        >
          ↓ JSONをエクスポート
        </button>
      </section>
      <section className="panel">
        <h2>バックアップを復元</h2>
        <p>読み込んだファイルの内容で、現在のデータを置き換えます。</p>
        <div className="file-picker">
          <input
            className="visually-hidden"
            id="backup-file"
            type="file"
            accept=".json,application/json"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              setPending(null);
              if (!file) return;
              if (file.size > 10000000) {
                notify("ファイルは10MB以下にしてください。");
                return;
              }
              try {
                setPending(parseBackup(await file.text()));
              } catch {
                notify("バックアップの形式が不正です。現在のデータは変更していません。");
              }
            }}
          />
          <label className="button" htmlFor="backup-file">
            バックアップを読み込む（JSON）
          </label>
        </div>
        {pending && (
          <div className="import-confirm">
            <p>
              応募者 {pending.candidates.length}名 / 職種 {pending.settings.jobs.length}
              件を読み込みます。
            </p>
            <div className="button-row">
              <button onClick={() => setPending(null)}>キャンセル</button>
              <button
                className="primary"
                onClick={() => {
                  update(pending);
                  setPending(null);
                  notify("バックアップを復元しました。");
                }}
              >
                現在のデータを置き換える
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
