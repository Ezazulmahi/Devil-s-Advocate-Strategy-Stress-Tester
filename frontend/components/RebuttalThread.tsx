"use client";

import { useState } from "react";
import { submitRebuttal } from "@/controllers/findings";
import type { Rebuttal } from "@/models/types";

export default function RebuttalThread({
  findingId,
  initialRebuttals,
  personaName,
}: {
  findingId: string;
  initialRebuttals: Rebuttal[];
  personaName: string;
}) {
  const [rebuttals, setRebuttals] = useState(initialRebuttals);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function respond() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    const rebuttal = await submitRebuttal(findingId, text);
    setRebuttals((prev) => [...prev, rebuttal]);
    setDraft("");
    setSending(false);
  }

  return (
    <>
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
              <p>{r.userResponse}</p>
            </div>
            <div className="rebuttal-item persona" style={{ marginTop: 12 }}>
              <span className="who">{personaName}</span>
              <p>{r.personaCounterResponse}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="sim-input">
        <input
          placeholder="Continue the defense..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") respond();
          }}
        />
        <button type="button" className="btn btn-dark" style={{ padding: "8px 16px" }} onClick={respond} disabled={sending}>
          {sending ? "Sending…" : "Respond"}
        </button>
      </div>
    </>
  );
}
