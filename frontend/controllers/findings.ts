import { FINDINGS, REBUTTALS, RUNS, PROJECTS } from "@/lib/mock-data";
import type { Finding, Rebuttal } from "@/models/types";

export async function getFindingsForRun(runId: string): Promise<Finding[]> {
  return FINDINGS.filter((f) => f.runId === runId);
}

export async function getFinding(findingId: string): Promise<Finding | null> {
  return FINDINGS.find((f) => f.id === findingId) ?? null;
}

export async function getFindingContext(findingId: string) {
  const finding = await getFinding(findingId);
  if (!finding) return null;
  const run = RUNS.find((r) => r.id === finding.runId) ?? null;
  const project = run ? PROJECTS.find((p) => p.id === run.projectId) ?? null : null;
  return { finding, run, project };
}

export async function getRebuttals(findingId: string): Promise<Rebuttal[]> {
  return REBUTTALS.filter((r) => r.findingId === findingId);
}

export async function submitRebuttal(
  findingId: string,
  userResponse: string
): Promise<Rebuttal> {
  return {
    id: `rebuttal-${Date.now()}`,
    findingId,
    userResponse,
    personaCounterResponse:
      "That narrows the gap, but I'd want to see this hold up at 10x the current sample before treating it as validated.",
    createdAt: new Date().toISOString().slice(0, 10),
  };
}
