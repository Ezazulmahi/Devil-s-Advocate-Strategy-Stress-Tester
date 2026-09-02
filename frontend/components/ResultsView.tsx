"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Finding, Persona } from "@/models/types";

interface ResultsViewProps {
  findings: Finding[];
  personas: Persona[];
}

export default function ResultsView({ findings, personas }: ResultsViewProps) {
  const [filter, setFilter] = useState<string>("all");

  const counts = useMemo(
    () => ({
      critical: findings.filter((f) => f.severity === "critical").length,
      major: findings.filter((f) => f.severity === "major").length,
      minor: findings.filter((f) => f.severity === "minor").length,
    }),
    [findings]
  );

  const visible = filter === "all" ? findings : findings.filter((f) => f.personaId === filter);
  const personaById = new Map(personas.map((p) => [p.id, p]));

  return (
    <>
      <div className="findings-summary">
        <div className="sum-card crit">
          <div className="count">{counts.critical}</div>
          <div className="lbl">Critical</div>
        </div>
        <div className="sum-card maj">
          <div className="count">{counts.major}</div>
          <div className="lbl">Major</div>
        </div>
        <div className="sum-card min">
          <div className="count">{counts.minor}</div>
          <div className="lbl">Minor</div>
        </div>
      </div>
      <div className="filter-row">
        <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          All Personas
        </button>
        {personas.map((p) => (
          <button
            key={p.id}
            type="button"
            className={filter === p.id ? "active" : ""}
            onClick={() => setFilter(p.id)}
          >
            {p.name.split(" ")[0]}
          </button>
        ))}
      </div>
      {visible.map((finding) => {
        const persona = personaById.get(finding.personaId);
        return (
          <Link key={finding.id} href={`/findings/${finding.id}`} className="case-file">
            <div className="case-file-head">
              <span className="persona-src">Persona: {persona?.name ?? finding.personaId}</span>
              <span className={`stamp-badge stamp-${finding.severity}`}>
                {finding.severity[0].toUpperCase() + finding.severity.slice(1)}
              </span>
            </div>
            <h4>{finding.title}</h4>
            <p>{finding.description}</p>
            <div className="fix">Suggested fix: {finding.suggestedFix}</div>
          </Link>
        );
      })}
    </>
  );
}
