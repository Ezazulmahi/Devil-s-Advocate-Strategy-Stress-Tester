import "server-only";

import { serverFetch } from "@/lib/server-api";
import type { Finding, Rebuttal, StressTestProject, StressTestRun } from "@/models/types";
import { getProject } from "@/controllers/projects";
import { getRun } from "@/controllers/runs";

export async function getFindingsForRun(runId: string): Promise<Finding[]> {
  return serverFetch<Finding[]>(`/runs/${runId}/findings?limit=500`);
}

export async function getFinding(findingId: string): Promise<Finding | null> {
  try {
    return await serverFetch<Finding>(`/findings/${findingId}`);
  } catch {
    return null;
  }
}

export async function getFindingContext(findingId: string): Promise<{
  finding: Finding;
  run: StressTestRun | null;
  project: StressTestProject | null;
} | null> {
  const finding = await getFinding(findingId);
  if (!finding) return null;
  const run = await getRun(finding.run_id);
  const project = run ? await getProject(run.project_id) : null;
  return { finding, run, project };
}

export async function getRebuttals(findingId: string): Promise<Rebuttal[]> {
  return serverFetch<Rebuttal[]>(`/findings/${findingId}/rebuttals`);
}
