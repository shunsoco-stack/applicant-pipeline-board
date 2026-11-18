"use client";

import Link from "next/link";
import { createSeed } from "@/lib/seed";
import { useStore } from "./provider";
import { Heading } from "./ui";

export function About() {
  const { update, notify } = useStore();
  return (
    <>
      <Heading
        eyebrow="ABOUT THIS DEMO"
        title="ひとりひとりに、ちゃんと向き合う。"
        description="兼務の採用担当者のための、小さな採用ノート。"
      />
      <section className="panel prose">
        <h2>このデモについて</h2>
        <p>
          みなと通商、応募者、面接官、選考内容はすべて架空です。実在の企業・個人とは無関係です。
        </p>
        <p>
          連絡期限を見逃さないこと、面接評価を1枚にまとめること、辞退理由から改善のヒントを得ることに絞っています。
        </p>
        <h2>保存先</h2>
        <p>
          データはこのブラウザのlocalStorage（apb:v1）に保存します。サーバーへの送信や他端末との同期はありません。ブラウザのデータを削除すると記録も消えるため、JSONバックアップをご利用ください。
        </p>
        <h2>日時の扱い</h2>
        <p>
          日本時間で記録し、期限は日付単位で判定します。土日・2025〜2027年の日本の祝日・12月29日〜1月3日を営業日から除きます。対象年以外の祝日は未対応です。休日にも連絡期限の持ち越しを確認できるよう、デモには休日が期限の例も含みます。
        </p>
        <h2>デモデータを作り直す</h2>
        <p>現在の変更を消し、この時点の日本時間を基準に45名の架空データを再生成します。</p>
        <button
          className="danger"
          onClick={() => {
            if (window.confirm("現在のデータを消し、既定データに戻しますか？")) {
              update(createSeed());
              notify("現在日時を基準に既定データを作り直しました。");
            }
          }}
        >
          既定データに戻す
        </button>
      </section>
      <nav className="utility-links">
        <Link className="button" href="/settings">
          設定
        </Link>
        <Link className="button" href="/backup">
          バックアップ
        </Link>
        <Link className="button" href="/">
          ボードへ
        </Link>
      </nav>
    </>
  );
}
