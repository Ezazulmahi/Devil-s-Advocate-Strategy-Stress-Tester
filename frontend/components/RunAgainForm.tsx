"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api-config";
import { clientFetch } from "@/lib/client-api";
import { PERSONAS } from "@/lib/mock-data";
import type { PersonaId, StressTestRun } from "@/models/types";

export default function RunAgainForm({
  projectId,
  defaultPersonas,
}: {
  projectId: string;
  defaultPersonas: PersonaId[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PersonaId[]>(defaultPersonas);
  const [submitting, setSubmitting] = useState(false);

  function toggle(id: PersonaId) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleRun() {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const run = await clientFetch<StressTestRun>(`/projects/${projectId}/run`, {
        method: "POST",
        body: JSON.stringify({ personas: selected }),
      });
      router.push(`/projects/${projectId}/runs/${run.id}/simulation`);
    } catch (err) {
      notify(err instanceof ApiError ? err.detail : "Couldn't start a new run.", "error");
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="btn btn-red" onClick={() => setOpen(true)}>
        Run Again
      </button>
    );
  }

  return (
    <div className="project-card" style={{ cursor: "default", marginBottom: 24 }}>
      <h3 style={{ marginBottom: 10 }}>Run this project again</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {PERSONAS.map((persona) => {
          const isSelected = selected.includes(persona.id);
          return (
            <button
              key={persona.id}
              type="button"
              onClick={() => toggle(persona.id)}
              className="btn"
              style={{
                background: isSelected ? "var(--red)" : "transparent",
                border: `1px solid ${isSelected ? "var(--red)" : "var(--border-light)"}`,
                color: isSelected ? "#fff" : "var(--text-light)",
                fontSize: 12,
                padding: "6px 12px",
              }}
            >
              {persona.name}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn-red"
          disabled={selected.length === 0 || submitting}
          onClick={handleRun}
        >
          {submitting ? "Starting…" : "Run Stress Test →"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
