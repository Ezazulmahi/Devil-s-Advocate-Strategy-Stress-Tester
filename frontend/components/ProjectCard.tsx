import Link from "next/link";
import type { StressTestProject, StressTestRun } from "@/models/types";

const TYPE_LABELS: Record<StressTestProject["inputType"], string> = {
  business_plan: "Business Plan",
  pitch: "Pitch",
  codebase: "Codebase",
  research_paper: "Research Paper",
};

interface ProjectCardProps {
  project: StressTestProject;
  runCount: number;
  findingCount: number;
  criticalCount: number;
  majorCount: number;
  latestRun: StressTestRun | null;
  allResolved: boolean;
}

export default function ProjectCard({
  project,
  runCount,
  findingCount,
  criticalCount,
  majorCount,
  latestRun,
  allResolved,
}: ProjectCardProps) {
  const href = latestRun
    ? `/projects/${project.id}/runs/${latestRun.id}`
    : `/projects/${project.id}/timeline`;

  let badge: { text: string; className: string } | null = null;
  if (latestRun?.status === "running") {
    badge = { text: "Live now", className: "stamp-major" };
  } else if (allResolved) {
    badge = { text: "Resolved", className: "stamp-resolved" };
  } else if (criticalCount > 0) {
    badge = { text: `${criticalCount} critical`, className: "stamp-critical" };
  } else if (majorCount > 0) {
    badge = { text: `${majorCount} major`, className: "stamp-major" };
  }

  return (
    <Link href={href} className="project-card">
      <span className="type-tag">{TYPE_LABELS[project.inputType]}</span>
      <h3>{project.title}</h3>
      <p>{project.rawInputPreview}</p>
      <div className="meta-row">
        <span>
          {runCount} run{runCount === 1 ? "" : "s"} · {findingCount} finding
          {findingCount === 1 ? "" : "s"}
        </span>
        {badge && <span className={`stamp-badge ${badge.className}`}>{badge.text}</span>}
      </div>
    </Link>
  );
}
