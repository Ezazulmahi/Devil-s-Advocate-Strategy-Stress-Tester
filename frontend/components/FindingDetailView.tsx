"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { ApiError } from "@/lib/api-config";
import { clientFetch } from "@/lib/client-api";
import type { Finding, Rebuttal } from "@/models/types";

const SEVERITY_LABEL = (s: string) => s[0].toUpperCase() + s.slice(1);

export default function FindingDetailView({
  initialFinding,
  initialRebuttals,
  personaName,
}: {
  initialFinding: Finding;
  initialRebuttals: Rebuttal[];
  personaName: string;
}) {
  const { notify } = useToast();
  const [finding, setFinding] = useState(initialFinding);
  const [rebuttals, setRebuttals] = useState(initialRebuttals);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function respond() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const rebuttal = await clientFetch<Rebuttal>(`/findings/${finding.id}/rebuttal`, {
        method: "POST",
        body: JSON.stringify({ user_response: text }),
      });
      setRebuttals((prev) => [...prev, rebuttal]);
      setDraft("");

      const refreshed = await clientFetch<Finding>(`/findings/${finding.id}`);
      if (refreshed.status !== finding.status || refreshed.severity !== finding.severity) {
        notify(
          refreshed.status === "resolved"
            ? `${personaName} conceded — finding marked resolved.`
            : refreshed.severity !== finding.severity
              ? `${personaName} downgraded this to ${refreshed.severity}.`
              : `${personaName} responded.`
        );
      }
      setFinding(refreshed);
    } catch (err) {
      notify(err instanceof ApiError ? err.detail : "Couldn't send that rebuttal.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1 style={{ fontSize: 18 }}>Finding — {finding.title}</h1>
          <p className="subtext">
            {personaName} · {SEVERITY_LABEL(finding.severity)} · Round {rebuttals.length + 1}
          </p>
        </div>
        <span style={{ display: "flex", gap: 8 }}>
          <span className={`stamp-badge stamp-${finding.severity}`}>
            {SEVERITY_LABEL(finding.severity)}
          </span>
          {finding.status === "resolved" && <span className="stamp-badge stamp-resolved">Resolved</span>}
          {finding.status === "downgraded" && <span className="stamp-badge stamp-major">Downgraded</span>}
        </span>
      </div>

      <div className="finding-detail">
        <h2>Original Finding</h2>
        <p>{finding.description}</p>
      </div>

      <h3 className="stamp" style={{ fontSize: 14, marginBottom: 12, color: "#fff" }}>
        Rebuttal Thread
      </h3>
      <div className="rebuttal-thread">
        {rebuttals.length === 0 && (
          <p className="subtext">No rebuttals yet — defend your position below.</p>
        )}
        {rebuttals.map((r) => (
          <div key={r.id}>
            <div className="rebuttal-item user">
              <span className="who">You</span>
              <p>{r.user_response}</p>
            </div>
            {r.persona_counter_response && (
              <div className="rebuttal-item persona" style={{ marginTop: 12 }}>
                <span className="who">{personaName}</span>
                <p>{r.persona_counter_response}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {finding.status === "resolved" ? (
        <p className="subtext">This finding has been resolved — no further defense needed.</p>
      ) : (
        <div className="sim-input">
          <input
            placeholder="Continue the defense..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") respond();
            }}
            disabled={sending}
          />
          <button
            type="button"
            className="btn btn-dark"
            style={{ padding: "8px 16px" }}
            onClick={respond}
            disabled={sending || draft.trim().length === 0}
          >
            {sending ? "Sending…" : "Respond"}
          </button>
        </div>
      )}
    </>
  );
}
