import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "応募者・採用進捗ボード",
  description:
    "応募者を待たせない。連絡期限、1枚の面接評価、辞退理由の振り返りをまとめた採用ボード。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
