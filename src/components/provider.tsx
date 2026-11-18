"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { japanNow } from "@/lib/dates";
import { loadDatabase, STORAGE_KEY } from "@/lib/storage";
import type { Candidate, Database, Stamp } from "@/lib/types";

type Store = {
  database: Database;
  now: Stamp;
  update: (database: Database) => void;
  updateCandidate: (candidate: Candidate) => void;
  notify: (message: string) => void;
};

const Context = createContext<Store | null>(null);

export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("データを読み込み中です。");
  return store;
}

export function Provider({ children }: { children: React.ReactNode }) {
  const [database, setDatabase] = useState<Database | null>(null);
  const [now, setNow] = useState<Stamp | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const initialize = () => {
      try {
        const loaded = loadDatabase(localStorage.getItem(STORAGE_KEY));
        setDatabase(loaded.database);
        setNotice(loaded.notice);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded.database));
        } catch {
          setNotice(
            "読み込んだデータは保持していますが保存できません。JSONバックアップを保存してください。",
          );
        }
      } catch {
        setDatabase(loadDatabase(null).database);
        setNotice("ブラウザへの保存が利用できません。変更後はJSONバックアップを保存してください。");
      }
      setNow(japanNow());
    };
    initialize();
    const timer = setInterval(() => setNow(japanNow()), 30000);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .catch(() => setNotice("オフライン機能を登録できませんでした。通常操作は利用できます。"));
    return () => clearInterval(timer);
  }, []);
  function update(next: Database) {
    setDatabase(next);
    setNow(japanNow());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setNotice("保存できませんでした。JSONバックアップを保存してください。");
    }
  }
  if (!database || !now) return <div className="loading">採用ボードを準備しています…</div>;
  return (
    <Context.Provider
      value={{
        database,
        now,
        update,
        updateCandidate: (candidate) =>
          update({
            ...database,
            candidates: database.candidates.map((item) =>
              item.id === candidate.id ? candidate : item,
            ),
          }),
        notify: setNotice,
      }}
    >
      {notice && (
        <div className="notice no-print" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="通知を閉じる">
            ×
          </button>
        </div>
      )}
      {children}
    </Context.Provider>
  );
}
