# Devil's Advocate Strategy Stress-Tester — Architecture & Design Doc

**Stack:** Next.js (frontend) · FastAPI (backend) · SQLAlchemy + PostgreSQL (database) · LangChain + RAG (AI layer)

## Core Features (High-Level)

**1. Multi-Domain Adversarial Critique**
- Works across business plans, pitches, codebases, and even research papers/theses — auto-detects the input type and adapts its persona set accordingly
- Multi-persona analysis — user selects which "attackers" to run:
  - **Aggressive Competitor** — finds where you're vulnerable to being out-executed
  - **Cynical Investor** — attacks financial assumptions, market size claims, unit economics
  - **Hacker/Red-Teamer** — for codebases: scans for real vulnerability patterns (injection, hardcoded secrets, auth bypass, insecure dependencies)
  - **Skeptical Customer** — attacks value proposition, "why would I actually use/pay for this"
  - **Academic Reviewer** — for research input: attacks methodology, statistical validity, novelty claims (shared logic with the Research Helper's critique chain)

**2. Live Market/Competitive Intelligence**
- Competitor persona doesn't argue from generic knowledge alone — it researches real, current competitors online and grounds its attacks in actual market data (pricing, feature comparisons, recent funding/news)

**3. Full War-Game Simulation**
- Beyond single-pass critique — runs a simulated multi-round adversarial dialogue (e.g., a full mock investor Q&A session, or a simulated penetration-test narrative) rather than a one-shot list of criticisms
- Escalation mode — user defends against a finding, and the persona escalates or concedes based on the strength of the rebuttal

**4. Automated Weakness Ranking & Remediation**
- **Aggregator agent** collects all findings across personas/rounds, deduplicates, and ranks by severity (critical / major / minor)
- Every finding comes with a concrete suggested fix, not just criticism
- Structured final report: "Here's exactly where your strategy breaks, ranked — and how to fix it"

**5. Codebase Penetration-Test Style Reporting**
- For code input: combines static vulnerability scanning with LLM reasoning to produce a report styled like a real pen-test deliverable (finding, severity, proof-of-concept description, remediation)

**6. Iteration Tracking**
- History of past stress-tests per project — tracks how the plan/pitch/code evolved across iterations and whether previously-flagged weaknesses were actually resolved

## Tech Architecture
- **Frontend (Next.js):** upload/paste input, persona selection, live simulation/dialogue view, results dashboard (severity-tagged cards), iteration timeline
- **Backend (FastAPI):** endpoints for submitting a target, running personas/simulations, fetching aggregated report, tracking iteration history
- **Multi-agent design (LangChain):**
  - Each persona = its own `PromptTemplate` + `ChatModel` chain, run in parallel (`RunnableParallel` in LCEL) for the initial pass, then sequentially for multi-round simulation/escalation
  - Competitor/market persona has web-search as a bound tool, so its critique is grounded in live data, not just model knowledge
  - For codebase analysis: a static-analysis pass (pattern matching for known vuln classes) feeds findings into the Hacker persona's context before it reasons — combines rule-based scanning with LLM reasoning
  - Aggregator chain: takes all persona outputs as input, prompted to deduplicate + rank + structure into a final JSON report
  - Output parser: `PydanticOutputParser` enforcing a `Finding` schema (severity, category, description, suggested_fix) — same schema pattern reused by the Research Helper's critique chain

## ER Schema

```
users
├── id (PK)
├── email
├── hashed_password

stress_test_projects
├── id (PK)
├── user_id (FK -> users.id)
├── title
├── input_type (business_plan | pitch | codebase)
├── raw_input (text or file path / repo URL)
├── created_at

stress_test_runs
├── id (PK)
├── project_id (FK -> stress_test_projects.id)
├── personas_used (JSON array: ["competitor", "investor", "hacker", "customer"])
├── status (pending | running | completed | failed)
├── created_at
├── completed_at

persona_findings
├── id (PK)
├── run_id (FK -> stress_test_runs.id)
├── persona (enum: competitor, investor, hacker, customer)
├── raw_output (full text response from that persona's chain)
├── created_at

findings
├── id (PK)
├── run_id (FK -> stress_test_runs.id)
├── persona_finding_id (FK -> persona_findings.id)
├── severity (critical | major | minor)
├── category
├── description
├── suggested_fix

rebuttals
├── id (PK)
├── finding_id (FK -> findings.id)
├── user_response
├── persona_counter_response
├── created_at
```

**Relationships:**
`users (1) → (N) stress_test_projects → (N) stress_test_runs → (N) persona_findings → (N) findings → (N) rebuttals`

## Key API Endpoints
```
POST   /projects                        create stress-test project (input the plan/codebase)
POST   /projects/{id}/run               trigger a stress-test run (specify personas)
GET    /runs/{id}                       get run status + results
GET    /runs/{id}/findings              get structured, ranked findings
POST   /findings/{id}/rebuttal          submit a defense, get persona counter-response
```

## Folder Structure
```
devils-advocate/
├── frontend/
│   └── app/
│       ├── projects/[id]/page.tsx
│       ├── projects/[id]/run/[runId]/page.tsx
├── backend/
│   ├── routers/
│   │   ├── projects.py
│   │   ├── runs.py
│   │   └── findings.py
│   ├── agents/
│   │   ├── personas/
│   │   │   ├── competitor.py
│   │   │   ├── investor.py
│   │   │   ├── hacker.py
│   │   │   └── customer.py
│   │   ├── static_scan.py     (rule-based codebase vuln scanning)
│   │   └── aggregator.py
│   ├── models/
│   └── schemas/
```

## Shared Infrastructure (across all agent projects)
- **Auth:** shared JWT-based auth system (FastAPI + `python-jose`)
- **Database:** PostgreSQL — SQLAlchemy models + Alembic for migrations
- **Vector DB:** Chroma for local dev; PGVector or Pinecone for production
- **Deployment:** Docker Compose (frontend, backend, Postgres, vector DB as separate containers)
- **Environment config:** `.env` — `DATABASE_URL`, `GROQ_API_KEY` / `OPENAI_API_KEY`, `VECTOR_DB_URL`, `JWT_SECRET`
