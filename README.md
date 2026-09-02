# Devil's Advocate

**Multi-persona AI agent that attacks your business plan, pitch, codebase, or research paper before reality does.**

Devil's Advocate is a full-stack adversarial critique platform. Instead of helping you build, it tries to break what you've already built — running your plan through specialized adversarial personas (an aggressive competitor, a cynical investor, a hacker, a skeptical customer, an academic reviewer) that each attack from a different angle, then aggregates their findings into a single, severity-ranked report with concrete fixes.

## Why

Most feedback tools are polite. A cofounder, an investor, or a real attacker won't be. This project simulates that pressure before you're standing in front of it — grounding the competitor persona in live market research, letting the hacker persona actually scan code for real vulnerability patterns, and running multi-round escalation so a weak defense gets pushed on exactly like it would in a real investor Q&A.

## Features

- **Multi-Domain Critique** — auto-detects whether you've submitted a business plan, pitch, codebase, or research paper, and adapts its persona set accordingly
- **Five Adversarial Personas** — Aggressive Competitor, Cynical Investor, Hacker/Red-Teamer, Skeptical Customer, and Academic Reviewer, each with its own reasoning style and attack pattern
- **Live Market Intelligence** — the Competitor persona is grounded in real, current competitor data via web search, not just model knowledge
- **Full War-Game Simulation** — multi-round adversarial dialogue rather than a one-shot critique; defend a finding and watch the persona escalate or concede based on your rebuttal
- **Codebase Pen-Test Reporting** — combines static vulnerability scanning with LLM reasoning for a report styled like a real penetration-test deliverable
- **Automated Weakness Ranking** — an aggregator agent deduplicates and ranks every finding by severity (critical / major / minor), each with a concrete suggested fix
- **Iteration Tracking** — full history of stress-test runs per project, tracking whether previously-flagged weaknesses were actually resolved

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| Backend | FastAPI |
| Database | PostgreSQL + SQLAlchemy |
| AI / Multi-Agent | LangChain (parallel + sequential chains), RAG for grounded critique |
| LLM Provider | Groq |

## Architecture

See [`docs/architecture.md`](./docs/architecture.md) for the full system design — ER schema, multi-agent orchestration, API endpoints, and folder structure.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # add your DATABASE_URL, GROQ_API_KEY, etc.
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
devils-advocate/
├── frontend/           # Next.js app
├── backend/             # FastAPI app
│   ├── routers/
│   ├── agents/
│   │   ├── personas/    # competitor, investor, hacker, customer, academic reviewer
│   │   ├── static_scan.py
│   │   └── aggregator.py
│   ├── models/
│   └── schemas/
└── docs/
    └── architecture.md
```

## Status

🚧 In active development.

## License

MIT
