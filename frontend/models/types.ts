export type InputType = "business_plan" | "pitch" | "codebase" | "research_paper";

export type PersonaId = "competitor" | "investor" | "hacker" | "customer" | "academic";

export type Severity = "critical" | "major" | "minor";

export type RunStatus = "pending" | "running" | "completed" | "failed";

export interface Persona {
  id: PersonaId;
  name: string;
  shortLabel: string;
  tagline: string;
  color: string;
}

export interface StressTestProject {
  id: string;
  title: string;
  inputType: InputType;
  rawInputPreview: string;
  createdAt: string;
}

export interface StressTestRun {
  id: string;
  projectId: string;
  runNumber: number;
  personasUsed: PersonaId[];
  status: RunStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface DialogueTurn {
  id: string;
  speaker: "user" | "persona";
  personaId?: PersonaId;
  text: string;
}

export interface PersonaFinding {
  id: string;
  runId: string;
  personaId: PersonaId;
  rawOutput: string;
}

export interface Finding {
  id: string;
  runId: string;
  personaFindingId: string;
  personaId: PersonaId;
  severity: Severity;
  category: string;
  title: string;
  description: string;
  suggestedFix: string;
  status: "open" | "resolved" | "downgraded";
}

export interface Rebuttal {
  id: string;
  findingId: string;
  userResponse: string;
  personaCounterResponse: string;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  projectId: string;
  runId: string;
  runNumber: number;
  date: string;
  title: string;
  summary: string;
  resolvedCount: number;
  criticalCount: number;
  majorCount: number;
  minorCount: number;
  isResolvedMilestone: boolean;
}
