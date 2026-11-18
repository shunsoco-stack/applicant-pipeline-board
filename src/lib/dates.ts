import type { Stamp } from "./types";

// 振替休日・国民の休日を含む。年末年始は別途判定する。
export const HOLIDAYS = new Set([
  "2025-01-01",
  "2025-01-13",
  "2025-02-11",
  "2025-02-23",
  "2025-02-24",
  "2025-03-20",
  "2025-04-29",
  "2025-05-03",
  "2025-05-04",
  "2025-05-05",
  "2025-05-06",
  "2025-07-21",
  "2025-08-11",
  "2025-09-15",
  "2025-09-23",
  "2025-10-13",
  "2025-11-03",
  "2025-11-23",
  "2025-11-24",
  "2026-01-01",
  "2026-01-12",
  "2026-02-11",
  "2026-02-23",
  "2026-03-20",
  "2026-04-29",
  "2026-05-03",
  "2026-05-04",
  "2026-05-05",
  "2026-05-06",
  "2026-07-20",
  "2026-08-11",
  "2026-09-21",
  "2026-09-22",
  "2026-09-23",
  "2026-10-12",
  "2026-11-03",
  "2026-11-23",
  "2027-01-01",
  "2027-01-11",
  "2027-02-11",
  "2027-02-23",
  "2027-03-21",
  "2027-03-22",
  "2027-04-29",
  "2027-05-03",
  "2027-05-04",
  "2027-05-05",
  "2027-07-19",
  "2027-08-11",
  "2027-09-20",
  "2027-09-23",
  "2027-10-11",
  "2027-11-03",
  "2027-11-23",
]);

export function japanNow(now = new Date()): Stamp {
  const iso = new Date(now.getTime() + 9 * 3600000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

export function shiftDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
}

export function isBusinessDay(date: string): boolean {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  const monthDay = date.slice(5);
  return (
    weekday !== 0 &&
    weekday !== 6 &&
    !HOLIDAYS.has(date) &&
    !(monthDay >= "12-29" || monthDay <= "01-03")
  );
}

export function addBusinessDays(date: string, days: number): string {
  let result = date;
  let remaining = Math.abs(days);
  while (remaining > 0) {
    result = shiftDays(result, days < 0 ? -1 : 1);
    if (isBusinessDay(result)) remaining--;
  }
  return result;
}

export function stampValue(stamp: Stamp): string {
  return `${stamp.date}T${stamp.time}`;
}

export function previousMinute(now = new Date()): Stamp {
  return japanNow(new Date(now.getTime() - 60000));
}
