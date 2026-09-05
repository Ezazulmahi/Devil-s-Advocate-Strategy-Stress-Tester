"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";
import { clientFetch } from "@/lib/client-api";
import type { PersonaId, RunStatus, StressTestRun } from "@/models/types";

const PERSONA_LABELS: Record<PersonaId, string> = {
  competitor: "Aggressive Competitor",
  investor: "Cynical Investor",
  hacker: "Hacker / Red-Teamer",
  customer: "Skeptical Customer",
  academic: "Academic Reviewer",
};

const STATUS_COPY: Record<RunStatus, string> = {
  pending: "Queued — about to start",
  running: "Personas are analyzing your submission in parallel",
  completed: "Simulation complete",
  failed: "Simulation failed",
};

interface RunProgressViewProps {
  projectId: string;
  runId: string;
  personasUsed: PersonaId[];
  initialStatus: RunStatus;
}

export default function RunProgressView({
  projectId,
  runId,
  personasUsed,
  initialStatus,
}: RunProgressViewProps) {
  const router = useRouter();
  const { notify } = useToast();
  const [status, setStatus] = useState<RunStatus>(initialStatus);
  const notified = useRef(false);

  useEffect(() => {
    if (status === "completed" || status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const run = await clientFetch<StressTestRun>(`/runs/${runId}`);
        setStatus(run.status);
      } catch {
        // transient network hiccup — keep polling
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [runId, status]);

  useEffect(() => {
    if (notified.current) return;
    if (status === "completed") {
      notified.current = true;
      notify("Simulation complete — results are ready.");
      const t = setTimeout(() => router.push(`/projects/${projectId}/runs/${runId}`), 900);
      return () => clearTimeout(t);
    }
    if (status === "failed") {
      notified.current = true;
      notify("Simulation failed — see details below.", "error");
    }
  }, [status, projectId, runId, router, notify]);

  return (
    <>
      <div className="sim-header">
        <span className="round-tag">
          ● {status === "failed" ? "FAILED" : status === "completed" ? "COMPLETE" : "IN PROGRESS"}
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
          {STATUS_COPY[status]}
        </span>
      </div>

      <div className="dialogue">
        {personasUsed.map((persona) => (
          <div key={persona} className="dlg-msg persona">
            <span className="who">{PERSONA_LABELS[persona]}</span>
            {status === "pending" && "Waiting to run…"}
            {status === "running" && "Reading your submission and building its critique…"}
            {status === "completed" && "Critique complete — see it in Results."}
            {status === "failed" && "Did not complete — the run failed before findings were produced."}
          </div>
        ))}
      </div>

      {status === "failed" && (
        <div className="sim-input" style={{ justifyContent: "center" }}>
          <span style={{ color: "var(--text-dim)", fontSize: 13 }}>
            Something went wrong generating this run. You can start a new stress test on this
            project from its timeline.
          </span>
        </div>
      )}

      {(status === "pending" || status === "running") && (
        <div className="sim-input" style={{ justifyContent: "center" }}>
          <span className="mono" style={{ color: "var(--text-dim)", fontSize: 12 }}>
            Checking for updates every few seconds…
          </span>
        </div>
      )}
    </>
  );
}
