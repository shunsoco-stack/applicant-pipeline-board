import type { Candidate } from "./types";

export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function createCsv(rows: unknown[][]): string {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function candidateCsv(candidates: Candidate[]): string {
  return createCsv([
    ["氏名", "職種", "応募経路", "応募日", "段階", "結果", "理由", "メモ", "終了日"],
    ...candidates.map((candidate) => [
      candidate.name,
      candidate.job,
      candidate.source,
      candidate.applied.date,
      candidate.stage,
      candidate.outcome?.kind,
      candidate.outcome?.reason,
      candidate.outcome?.note,
      candidate.outcome?.at.date,
    ]),
  ]);
}

export function csvFilename(today: string, start?: string, end?: string): string {
  return start && end ? `辞退見送り一覧_${start}_${end}.csv` : `応募者一覧_${today}.csv`;
}

export function download(text: string, filename: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
