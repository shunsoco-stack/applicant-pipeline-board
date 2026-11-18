import Link from "next/link";
import { deadlineStatus } from "@/lib/deadlines";

export function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="description">{description}</p>
      </div>
      <div className="heading-actions no-print">{children}</div>
    </div>
  );
}

export function DeadlineBadge({ deadline, today }: { deadline: string; today: string }) {
  const status = deadlineStatus(deadline, today);
  return (
    <span className={`badge ${status.key}`}>
      {status.key === "overdue" ? "! " : "◷ "}
      {status.label}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function CandidateLink({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <Link href={`/candidates/${id}`} prefetch={false}>
      {children}
    </Link>
  );
}
