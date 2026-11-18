"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CandidateDetail } from "@/components/candidate-detail";
import { Scorecard } from "@/components/scorecard";

export default function NotFound() {
  const pathname = usePathname();
  if (/^\/candidates\/[^/]+\/scorecard\/?$/.test(pathname)) return <Scorecard />;
  if (/^\/candidates\/[^/]+\/?$/.test(pathname)) return <CandidateDetail />;
  return (
    <section className="panel">
      <h1>ページが見つかりません</h1>
      <Link href="/">ボードへ戻る</Link>
    </section>
  );
}
