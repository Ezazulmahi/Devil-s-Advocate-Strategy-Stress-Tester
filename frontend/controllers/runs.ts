import "server-only";

import { unstable_rethrow } from "next/navigation";
import { serverFetch } from "@/lib/server-api";
import type { StressTestProject, StressTestRun } from "@/models/types";
import { getProject } from "@/controllers/projects";

export async function getRunsForProject(projectId: string): Promise<StressTestRun[]> {
  return serverFetch<StressTestRun[]>(`/projects/${projectId}/runs`);
}

export async function getRun(runId: string): Promise<StressTestRun | null> {
  try {
    return await serverFetch<StressTestRun>(`/runs/${runId}`);
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

export async function getRunWithProject(
  runId: string
): Promise<{ run: StressTestRun; project: StressTestProject | null } | null> {
  const run = await getRun(runId);
  if (!run) return null;
  const project = await getProject(run.project_id);
  return { run, project };
}
