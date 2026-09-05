"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Finding, Persona, Severity } from "@/models/types";

interface ResultsViewProps {
  findings: Finding[];
  personas: Persona[];
}

const SEVERITIES: Severity[] = ["critical", "major", "minor"];

export default function ResultsView({ findings, personas }: ResultsViewProps) {
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const counts = useMemo(
    () => ({
      critical: findings.filter((f) => f.severity === "critical").length,
      major: findings.filter((f) => f.severity === "major").length,
      minor: findings.filter((f) => f.severity === "minor").length,
    }),
    [findings]
  );

  const visible = findings.filter(
    (f) =>
      (personaFilter === "all" || f.persona === personaFilter) &&
      (severityFilter === "all" || f.severity === severityFilter)
  );
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
        <button
          type="button"
          className={personaFilter === "all" ? "active" : ""}
          onClick={() => setPersonaFilter("all")}
        >
          All Personas
        </button>
        {personas.map((p) => (
          <button
            key={p.id}
            type="button"
            className={personaFilter === p.id ? "active" : ""}
            onClick={() => setPersonaFilter(p.id)}
          >
            {p.name.split(" ")[0]}
          </button>
        ))}
      </div>
      <div className="filter-row">
        <button
          type="button"
          className={severityFilter === "all" ? "active" : ""}
          onClick={() => setSeverityFilter("all")}
        >
          All Severities
        </button>
        {SEVERITIES.map((s) => (
          <button
            key={s}
            type="button"
            className={severityFilter === s ? "active" : ""}
            onClick={() => setSeverityFilter(s)}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="subtext">No findings match this filter.</p>
      )}

      {visible.map((finding) => {
        const persona = personaById.get(finding.persona);
        return (
          <Link key={finding.id} href={`/findings/${finding.id}`} className="case-file">
            <div className="case-file-head">
              <span className="persona-src">Persona: {persona?.name ?? finding.persona}</span>
              <span className={`stamp-badge stamp-${finding.severity}`}>
                {finding.severity[0].toUpperCase() + finding.severity.slice(1)}
              </span>
            </div>
            <h4>{finding.title}</h4>
            <p>{finding.description}</p>
            <div className="fix">Suggested fix: {finding.suggested_fix}</div>
          </Link>
        );
      })}
    </>
  );
}
