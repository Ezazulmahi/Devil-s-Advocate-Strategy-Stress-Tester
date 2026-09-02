import type { Severity } from "@/models/types";

const LABELS: Record<Severity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
};

export function SeverityStamp({ severity }: { severity: Severity }) {
  return <span className={`stamp-badge stamp-${severity}`}>{LABELS[severity]}</span>;
}

export function StatusStamp({ status }: { status: "open" | "resolved" | "downgraded" }) {
  if (status === "resolved") return <span className="stamp-badge stamp-resolved">Resolved</span>;
  if (status === "downgraded")
    return <span className="stamp-badge stamp-major">Downgraded</span>;
  return null;
}
