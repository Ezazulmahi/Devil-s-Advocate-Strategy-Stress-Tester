import { PROJECTS, RUNS, FINDINGS } from "@/lib/mock-data";
import type { StressTestProject } from "@/models/types";

export async function getProjects(): Promise<StressTestProject[]> {
  return PROJECTS;
}

export async function getProject(projectId: string): Promise<StressTestProject | null> {
  return PROJECTS.find((p) => p.id === projectId) ?? null;
}

export async function getProjectSummary(projectId: string) {
  const runs = RUNS.filter((r) => r.projectId === projectId);
  const runIds = new Set(runs.map((r) => r.id));
  const findings = FINDINGS.filter((f) => runIds.has(f.runId));
  const critical = findings.filter((f) => f.severity === "critical").length;
  const major = findings.filter((f) => f.severity === "major").length;
  const allResolved = findings.length > 0 && findings.every((f) => f.status === "resolved");
  return {
    runCount: runs.length,
    findingCount: findings.length,
    criticalCount: critical,
    majorCount: major,
    latestRun: runs[runs.length - 1] ?? null,
    allResolved,
  };
}

export interface CreateProjectInput {
  title: string;
  inputType: StressTestProject["inputType"];
  rawInput: string;
  personaIds: string[];
}

export async function createProject(input: CreateProjectInput): Promise<StressTestProject> {
  return {
    id: `project-${Date.now()}`,
    title: input.title || "Untitled Stress Test",
    inputType: input.inputType,
    rawInputPreview: input.rawInput.slice(0, 160),
    createdAt: new Date().toISOString().slice(0, 10),
  };
}
