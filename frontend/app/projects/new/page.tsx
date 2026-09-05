"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";
import { PERSONAS } from "@/lib/mock-data";
import { ApiError } from "@/lib/api-config";
import { clientFetch } from "@/lib/client-api";
import type { InputTypeDetectResponse, PersonaId, StressTestProject, StressTestRun } from "@/models/types";

const INPUT_TABS: { id: "paste" | "upload" | "repo"; label: string }[] = [
  { id: "paste", label: "Paste Text" },
  { id: "upload", label: "Upload PDF" },
  { id: "repo", label: "GitHub Repo URL" },
];

const DEFAULT_SELECTED: PersonaId[] = ["competitor", "investor", "customer"];

export default function NewStressTestPage() {
  const router = useRouter();
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<(typeof INPUT_TABS)[number]["id"]>("paste");
  const [title, setTitle] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<PersonaId[]>(DEFAULT_SELECTED);
  const [personasTouched, setPersonasTouched] = useState(false);
  const [detected, setDetected] = useState<InputTypeDetectResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePersona(id: PersonaId) {
    setPersonasTouched(true);
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function handleRawInputBlur() {
    if (rawInput.trim().length < 20) return;
    try {
      const result = await clientFetch<InputTypeDetectResponse>("/projects/detect-input-type", {
        method: "POST",
        body: JSON.stringify({ raw_input: rawInput }),
      });
      setDetected(result);
      if (!personasTouched) {
        setSelected(result.suggested_personas);
      }
    } catch {
      // Detection is a convenience, not a requirement — fail silently and let the user pick manually.
    }
  }

  function canSubmit(): boolean {
    if (selected.length === 0) return false;
    if (!title.trim()) return false;
    if (activeTab === "paste") return rawInput.trim().length > 0;
    if (activeTab === "upload") return file !== null;
    return repoUrl.trim().length > 0;
  }

  async function handleRun() {
    if (!canSubmit() || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      let project: StressTestProject;
      if (activeTab === "paste") {
        project = await clientFetch<StressTestProject>("/projects", {
          method: "POST",
          body: JSON.stringify({ title: title.trim(), raw_input: rawInput }),
        });
      } else if (activeTab === "upload") {
        const form = new FormData();
        form.append("title", title.trim());
        form.append("file", file as File);
        project = await clientFetch<StressTestProject>("/projects/upload", {
          method: "POST",
          body: form,
        });
      } else {
        project = await clientFetch<StressTestProject>("/projects/from-repo", {
          method: "POST",
          body: JSON.stringify({ title: title.trim(), repo_url: repoUrl.trim() }),
        });
      }

      const run = await clientFetch<StressTestRun>(`/projects/${project.id}/run`, {
        method: "POST",
        body: JSON.stringify({ personas: selected }),
      });

      router.push(`/projects/${project.id}/runs/${run.id}/simulation`);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.");
      notify("Couldn't start the stress test — see the error above.", "error");
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>New Stress Test</h1>
          <p className="subtext">Submit your plan, pitch, or codebase for adversarial review</p>
        </div>
      </div>

      <div className="field" style={{ maxWidth: 480, marginBottom: 20 }}>
        <label htmlFor="title">Project title</label>
        <input
          id="title"
          placeholder="e.g. D2C Skincare Launch — Pitch v4"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="input-tabs">
        {INPUT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "active" : ""}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="drop-zone">
        {activeTab === "paste" && (
          <textarea
            placeholder="Paste your business plan, pitch, or code excerpt here."
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            onBlur={handleRawInputBlur}
          />
        )}
        {activeTab === "upload" && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? file.name : "Choose a PDF file"}
            </button>
          </div>
        )}
        {activeTab === "repo" && (
          <input
            placeholder="https://github.com/your-org/your-repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid var(--border-light)",
              borderRadius: 3,
              padding: "10px 12px",
              color: "var(--text-light)",
              fontFamily: "var(--font-inter)",
              fontSize: 13.5,
            }}
          />
        )}
      </div>

      {detected && (
        <p className="subtext" style={{ marginTop: -12, marginBottom: 20 }}>
          Detected as <strong>{detected.input_type.replace("_", " ")}</strong> — suggested personas
          preselected below, still yours to change.
        </p>
      )}

      <h3 className="stamp" style={{ fontSize: 14, marginBottom: 12, color: "#fff" }}>
        Select Personas
      </h3>
      <div className="persona-grid">
        {PERSONAS.map((persona) => {
          const isSelected = selected.includes(persona.id);
          return (
            <button
              key={persona.id}
              type="button"
              className={`persona-card${isSelected ? " selected" : ""}`}
              onClick={() => togglePersona(persona.id)}
            >
              <div className="check">{isSelected ? "✓" : ""}</div>
              <div className="p-icon" style={{ background: persona.color }}>
                {persona.shortLabel}
              </div>
              <h4>{persona.name}</h4>
              <p>{persona.tagline}</p>
            </button>
          );
        })}
      </div>

      {error && <p style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 14 }}>{error}</p>}

      <button
        type="button"
        className="btn btn-red"
        style={{ padding: "12px 28px" }}
        disabled={!canSubmit() || submitting}
        onClick={handleRun}
      >
        {submitting ? "Starting…" : "Run Stress Test →"}
      </button>
    </AppShell>
  );
}
