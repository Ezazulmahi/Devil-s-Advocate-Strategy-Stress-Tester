"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { clientFetch } from "@/lib/client-api";
import type { StressTestProject, StressTestRun } from "@/models/types";

const TYPE_LABELS: Record<string, string> = {
  business_plan: "Business Plan",
  pitch: "Pitch",
  codebase: "Codebase",
  research_paper: "Research Paper",
};

interface ProjectListRowProps {
  project: StressTestProject;
  runCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  latestRun: StressTestRun | null;
}

export default function ProjectListRow({
  project,
  runCount,
  criticalCount,
  majorCount,
  minorCount,
  latestRun,
}: ProjectListRowProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await clientFetch(`/projects/${project.id}`, { method: "DELETE" });
      notify(`"${project.title}" and its full run history were deleted.`);
      router.refresh();
    } catch {
      notify("Couldn't delete this project — please try again.", "error");
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="project-card" style={{ display: "block", cursor: "default" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 240, flex: 1 }}>
          <span className="type-tag">{TYPE_LABELS[project.input_type]}</span>
          <h3>{project.title}</h3>
          <p style={{ marginBottom: 0 }}>{project.raw_input.slice(0, 160)}</p>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
            RUNS
            <div style={{ fontSize: 16, color: "#fff", marginTop: 2 }}>{runCount}</div>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--red)" }}>
            CRITICAL
            <div style={{ fontSize: 16, color: "var(--red)", marginTop: 2 }}>{criticalCount}</div>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--amber)" }}>
            MAJOR
            <div style={{ fontSize: 16, color: "var(--amber)", marginTop: 2 }}>{majorCount}</div>
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--steel)" }}>
            MINOR
            <div style={{ fontSize: 16, color: "var(--steel)", marginTop: 2 }}>{minorCount}</div>
          </div>
        </div>
      </div>

      <div className="meta-row" style={{ marginTop: 16 }}>
        <span>
          Created {project.created_at.slice(0, 10)}
          {latestRun && ` · last run ${latestRun.created_at.slice(0, 10)}`}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {latestRun && (
            <Link
              href={`/projects/${project.id}/runs/${latestRun.id}`}
              className="btn btn-ghost"
              style={{ padding: "6px 12px", fontSize: 12 }}
            >
              View results
            </Link>
          )}
          <Link
            href={`/projects/${project.id}/timeline`}
            className="btn btn-dark"
            style={{ padding: "6px 12px", fontSize: 12 }}
          >
            History
          </Link>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: "6px 12px", fontSize: 12, borderColor: "var(--red)", color: "var(--red)" }}
            onClick={() => setConfirmOpen(true)}
          >
            Delete
          </button>
        </div>
      </div>

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
