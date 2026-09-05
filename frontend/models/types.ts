export type InputType = "business_plan" | "pitch" | "codebase" | "research_paper";

export type PersonaId = "competitor" | "investor" | "hacker" | "customer" | "academic";

export type Severity = "critical" | "major" | "minor";

export type RunStatus = "pending" | "running" | "completed" | "failed";

export type FindingStatus = "open" | "resolved" | "downgraded";

// Static UI metadata for the persona picker — not fetched from the API.
export interface Persona {
  id: PersonaId;
  name: string;
  shortLabel: string;
  tagline: string;
  color: string;
}

// Everything below mirrors the FastAPI response shapes (snake_case) exactly,
// so controllers/*.ts can pass API JSON straight through with no mapping layer.

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface StressTestProject {
  id: string;
  user_id: string;
  title: string;
  input_type: InputType;
  raw_input: string;
  created_at: string;
}

export interface StressTestRun {
  id: string;
  project_id: string;
  personas_used: PersonaId[];
  status: RunStatus;
  created_at: string;
  completed_at: string | null;
}

export interface Finding {
  id: string;
  run_id: string;
  persona_finding_id: string;
  persona: PersonaId;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  suggested_fix: string;
  status: FindingStatus;
  created_at: string;
}

export interface Rebuttal {
  id: string;
  finding_id: string;
  user_response: string;
  persona_counter_response: string | null;
  created_at: string;
}

export interface TimelineEntry {
  run_id: string;
  run_number: number;
  status: RunStatus;
  created_at: string;
  completed_at: string | null;
  critical_count: number;
  major_count: number;
  minor_count: number;
  resolved_count: number;
  downgraded_count: number;
}

export interface InputTypeDetectResponse {
  input_type: InputType;
  suggested_personas: PersonaId[];
}
