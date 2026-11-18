import { daysBetween } from "./dates";
import type { Candidate } from "./types";

export function deadlineStatus(deadline: string, today: string) {
  const remaining = daysBetween(today, deadline);
  if (remaining < 0) return { key: "overdue", label: `${-remaining}日期限切れ`, remaining };
  if (remaining === 0) return { key: "today", label: "今日まで", remaining };
  if (remaining === 1) return { key: "soon", label: "あと1日", remaining };
  return { key: "safe", label: `あと${remaining}日`, remaining };
}

export function waitingDays(candidate: Candidate, today: string) {
  return daysBetween(candidate.contacts.at(-1)?.at.date ?? candidate.applied.date, today);
}

export function stageDays(candidate: Candidate, today: string) {
  return daysBetween(candidate.history.at(-1)!.entered.date, candidate.outcome?.at.date ?? today);
}

export function hasMissed(candidate: Candidate, today: string): boolean {
  return (
    candidate.missed ||
    candidate.contacts.some((contact) => contact.at.date > contact.due) ||
    (!candidate.outcome && candidate.deadline < today)
  );
}
