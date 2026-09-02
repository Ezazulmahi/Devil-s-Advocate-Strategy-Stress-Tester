import { RUNS, DIALOGUE, PROJECTS } from "@/lib/mock-data";
import type { StressTestRun, DialogueTurn } from "@/models/types";

export async function getRunsForProject(projectId: string): Promise<StressTestRun[]> {
  return RUNS.filter((r) => r.projectId === projectId);
}

export async function getRun(runId: string): Promise<StressTestRun | null> {
  return RUNS.find((r) => r.id === runId) ?? null;
}

export async function getRunWithProject(runId: string) {
  const run = await getRun(runId);
  if (!run) return null;
  const project = PROJECTS.find((p) => p.id === run.projectId) ?? null;
  return { run, project };
}

export async function getDialogue(runId: string): Promise<DialogueTurn[]> {
  return DIALOGUE.filter((turn) => turn.runId === runId);
}

export async function startRun(
  projectId: string,
  personaIds: string[]
): Promise<StressTestRun> {
  return {
    id: `run-${Date.now()}`,
    projectId,
    runNumber: RUNS.filter((r) => r.projectId === projectId).length + 1,
    personasUsed: personaIds as StressTestRun["personasUsed"],
    status: "running",
    createdAt: new Date().toISOString().slice(0, 10),
    completedAt: null,
  };
}
