"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { clientFetch } from "@/lib/client-api";
import type { StressTestProject, StressTestRun } from "@/models/types";

const TYPE_LABELS: Record<StressTestProject["input_type"], string> = {
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
  const router = useRouter();
  const { notify } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const href = latestRun
    ? `/projects/${project.id}/runs/${latestRun.id}`
    : `/projects/${project.id}/timeline`;

  let badge: { text: string; className: string } | null = null;
  if (latestRun?.status === "running" || latestRun?.status === "pending") {
    badge = { text: "Live now", className: "stamp-major" };
  } else if (allResolved) {
    badge = { text: "Resolved", className: "stamp-resolved" };
  } else if (criticalCount > 0) {
    badge = { text: `${criticalCount} critical`, className: "stamp-critical" };
  } else if (majorCount > 0) {
    badge = { text: `${majorCount} major`, className: "stamp-major" };
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await clientFetch(`/projects/${project.id}`, { method: "DELETE" });
      notify(`"${project.title}" and its full run history were deleted.`);
      setConfirmOpen(false);
      router.refresh();
    } catch {
      notify("Couldn't delete this project — please try again.", "error");
      setDeleting(false);
    }
  }

  return (
    <div className="project-card" style={{ position: "relative" }}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setConfirmOpen(true);
        }}
        aria-label={`Delete ${project.title}`}
        className="btn btn-ghost"
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          padding: "3px 9px",
          fontSize: 11,
          borderColor: "var(--border-light)",
        }}
      >
        Delete
      </button>
      <Link href={href} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
        <span className="type-tag">{TYPE_LABELS[project.input_type]}</span>
        <h3 style={{ paddingRight: 60 }}>{project.title}</h3>
        <p>{project.raw_input.slice(0, 140)}</p>
        <div className="meta-row">
          <span>
            {runCount} run{runCount === 1 ? "" : "s"} · {findingCount} finding
            {findingCount === 1 ? "" : "s"}
          </span>
          {badge && <span className={`stamp-badge ${badge.className}`}>{badge.text}</span>}
        </div>
      </Link>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this project?"
        description={`This permanently deletes "${project.title}" along with every run, finding, and rebuttal in its history. This can't be undone.`}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
