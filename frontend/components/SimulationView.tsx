"use client";

import { useState } from "react";
import type { DialogueTurn, Persona } from "@/models/types";

interface SimulationViewProps {
  runId: string;
  initialDialogue: DialogueTurn[];
  persona: Persona;
  round: string;
}

const ESCALATION_REPLIES = [
  "That narrows the gap, but I still don't see it holding up under real investor scrutiny — what's your fallback if this doesn't scale?",
  "Fair point, but a single data point isn't a trend. What happens to this assumption at 10x volume?",
  "I'll grant that's a stronger answer than before. I'm downgrading the severity, but it's not resolved yet.",
];

export default function SimulationView({ runId, initialDialogue, persona, round }: SimulationViewProps) {
  const [dialogue, setDialogue] = useState(initialDialogue);
  const [draft, setDraft] = useState("");

  function respond() {
    const text = draft.trim();
    if (!text) return;
    const userTurn: DialogueTurn = {
      id: `user-${Date.now()}`,
      runId,
      speaker: "user",
      text,
    };
    const reply =
      ESCALATION_REPLIES[Math.floor(Math.random() * ESCALATION_REPLIES.length)];
    const personaTurn: DialogueTurn = {
      id: `persona-${Date.now()}`,
      runId,
      speaker: "persona",
      personaId: persona.id,
      text: reply,
    };
    setDialogue((prev) => [...prev, userTurn, personaTurn]);
    setDraft("");
  }

  return (
    <>
      <div className="sim-header">
        <span className="round-tag">● {round}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
          00:{String(dialogue.length * 14).padStart(2, "0")} elapsed
        </span>
      </div>
      <div className="dialogue">
        {dialogue.length === 0 && (
          <p className="subtext">No opening statement yet — defend your position to start the exchange.</p>
        )}
        {dialogue.map((turn) => (
          <div key={turn.id} className={`dlg-msg ${turn.speaker}`}>
            <span className="who">{turn.speaker === "user" ? "You" : persona.name}</span>
            {turn.text}
          </div>
        ))}
      </div>
      <div className="sim-input">
        <input
          placeholder="Defend your position..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") respond();
          }}
        />
        <button type="button" className="btn btn-dark" style={{ padding: "8px 16px" }} onClick={respond}>
          Respond
        </button>
      </div>
    </>
  );
}
