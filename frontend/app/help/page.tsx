import AppShell from "@/components/AppShell";
import { PERSONAS } from "@/lib/mock-data";

const STEPS = [
  {
    title: "1. Submit your plan, pitch, or codebase",
    body: "Paste text, upload a PDF, or point at a GitHub repo. Devil's Advocate auto-detects whether it's a business plan, pitch, codebase, or research paper and adapts which personas make sense.",
  },
  {
    title: "2. Pick your attackers",
    body: "Select one or more adversarial personas. Each one reasons differently and attacks a different angle — run all five for the harshest possible pass.",
  },
  {
    title: "3. Watch the war-game",
    body: "Personas don't just list complaints once. In Live Simulation, defend a point and the persona will push back, escalate, or concede based on how strong your rebuttal actually is.",
  },
  {
    title: "4. Work the ranked report",
    body: "Every finding is deduplicated and ranked critical / major / minor with a concrete suggested fix — not just criticism. Fix it, then re-run to see what got resolved.",
  },
];

const FAQ = [
  {
    q: "Does a rebuttal actually change the finding's severity?",
    a: "Yes — a strong rebuttal with real evidence can get a persona to downgrade or resolve a finding. A weak one gets pushed on harder, exactly like a real investor Q&A.",
  },
  {
    q: "What's different about the Hacker persona?",
    a: "For codebase input, static vulnerability scanning (injection, hardcoded secrets, auth bypass, insecure dependencies) feeds directly into the Hacker persona's context before it reasons, so findings are grounded in real patterns, not just guesses.",
  },
  {
    q: "Is the Competitor persona grounded in real data?",
    a: "Yes — it's bound to live web search, so its attacks reference actual competitor pricing, features, and recent funding/news rather than generic model knowledge.",
  },
  {
    q: "Can I track whether a weakness actually got fixed?",
    a: "Every project has an Iteration Timeline showing every run and which previously-flagged findings were resolved, downgraded, or are still open.",
  },
];

export default function HelpPage() {
  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Help</h1>
          <p className="subtext">How Devil&apos;s Advocate works, and how to get the most out of it</p>
        </div>
      </div>

      <h3 className="stamp" style={{ fontSize: 14, marginBottom: 12, color: "#fff" }}>
        Getting Started
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {STEPS.map((step) => (
          <div key={step.title} className="project-card" style={{ cursor: "default" }}>
            <h3 style={{ marginBottom: 6 }}>{step.title}</h3>
            <p style={{ marginBottom: 0 }}>{step.body}</p>
          </div>
        ))}
      </div>

      <h3 className="stamp" style={{ fontSize: 14, marginBottom: 12, color: "#fff" }}>
        The Personas
      </h3>
      <div className="persona-grid">
        {PERSONAS.map((persona) => (
          <div key={persona.id} className="persona-card" style={{ cursor: "default" }}>
            <div className="p-icon" style={{ background: persona.color }}>
              {persona.shortLabel}
            </div>
            <h4>{persona.name}</h4>
            <p>{persona.tagline}</p>
          </div>
        ))}
      </div>

      <h3 className="stamp" style={{ fontSize: 14, margin: "8px 0 12px", color: "#fff" }}>
        FAQ
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {FAQ.map((item) => (
          <div key={item.q} className="project-card" style={{ cursor: "default" }}>
            <h3 style={{ marginBottom: 6, fontSize: 14 }}>{item.q}</h3>
            <p style={{ marginBottom: 0 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
