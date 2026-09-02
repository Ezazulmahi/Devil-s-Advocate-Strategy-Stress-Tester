"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { PERSONAS } from "@/lib/mock-data";
import { createProject } from "@/controllers/projects";
import { startRun } from "@/controllers/runs";
import type { InputType, PersonaId } from "@/models/types";

const INPUT_TABS: { id: "paste" | "upload" | "repo"; label: string }[] = [
  { id: "paste", label: "Paste Text" },
  { id: "upload", label: "Upload PDF" },
  { id: "repo", label: "GitHub Repo URL" },
];

const DEFAULT_SELECTED: PersonaId[] = ["competitor", "investor", "customer"];

function inferInputType(personaIds: PersonaId[]): InputType {
  if (personaIds.includes("hacker")) return "codebase";
  if (personaIds.includes("academic")) return "research_paper";
  return "business_plan";
}

export default function NewStressTestPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof INPUT_TABS)[number]["id"]>("paste");
  const [title, setTitle] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [selected, setSelected] = useState<PersonaId[]>(DEFAULT_SELECTED);
  const [submitting, setSubmitting] = useState(false);

  const placeholder = useMemo(() => {
    if (activeTab === "upload") return "Drag a PDF into this area, or click to browse.";
    if (activeTab === "repo") return "https://github.com/your-org/your-repo";
    return "Paste your business plan, pitch, or code excerpt here — or drag a file into this area.";
  }, [activeTab]);

  function togglePersona(id: PersonaId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleRun() {
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    await createProject({
      title: title.trim() || "Untitled Stress Test",
      inputType: inferInputType(selected),
      rawInput,
      personaIds: selected,
    });
    await startRun("d2c-skincare", selected);
    router.push(`/projects/d2c-skincare/runs/run-d2c-3/simulation`);
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
        {activeTab === "paste" ? (
          <textarea
            placeholder={placeholder}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
          />
        ) : (
          <span>{placeholder}</span>
        )}
      </div>

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
      <button
        type="button"
        className="btn btn-red"
        style={{ padding: "12px 28px" }}
        disabled={selected.length === 0 || submitting}
        onClick={handleRun}
      >
        {submitting ? "Starting…" : "Run Stress Test →"}
      </button>
    </AppShell>
  );
}
