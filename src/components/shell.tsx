"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Provider } from "./provider";

const LINKS = [
  ["/", "▦", "進捗ボード"],
  ["/today", "◷", "今日やること"],
  ["/candidates", "♧", "応募者一覧"],
  ["/insights", "▥", "辞退・振り返り"],
  ["/settings", "⚙", "設定"],
  ["/backup", "↓", "バックアップ"],
  ["/about", "ⓘ", "このデモについて"],
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <Link href="/" className="brand">
          <span className="brand-icon">m.</span>
          <span>
            みなと採用ノート<small>APPLICANT PIPELINE BOARD</small>
          </span>
        </Link>
        <div className="company">
          みなと通商<span>（架空）</span>
          <small>採用チームのワークスペース</small>
        </div>
        <nav aria-label="メインナビゲーション">
          {LINKS.map(([href, icon, label]) => (
            <Link
              key={href}
              href={href}
              className={
                (href === "/" ? pathname === href : pathname.startsWith(href)) ? "active" : ""
              }
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="green-dot" /> このブラウザに自動保存
          <small>
            ひとりひとりに、
            <br />
            ちゃんと向き合う採用を。
          </small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar no-print">
          <span>
            採用管理 <span className="separator">/</span> みなと通商
          </span>
          <span className="demo-tag">デモ用の架空データです</span>
        </header>
        <main>
          <Provider>{children}</Provider>
        </main>
        <footer className="no-print">
          MINATO RECRUITMENT NOTE <span>すべて架空の企業・人物です</span>
        </footer>
      </div>
      <nav className="mobile-nav no-print" aria-label="モバイルナビゲーション">
        {LINKS.slice(0, 4).map(([href, icon, label]) => (
          <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
            <span aria-hidden="true">{icon}</span>
            {label.replace("進捗", "").replace("辞退・", "")}
          </Link>
        ))}
        <Link href="/about">
          <span>☰</span>その他
        </Link>
      </nav>
    </div>
  );
}
