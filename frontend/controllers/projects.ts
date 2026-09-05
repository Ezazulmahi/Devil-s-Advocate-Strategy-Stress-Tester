import "server-only";

import { unstable_rethrow } from "next/navigation";
import { serverFetch, serverFetchPage } from "@/lib/server-api";
import type { StressTestProject, StressTestRun, TimelineEntry } from "@/models/types";

export const PROJECTS_PAGE_SIZE = 20;

export async function getProjects(): Promise<StressTestProject[]> {
  return serverFetch<StressTestProject[]>("/projects?limit=200");
}

export async function getProjectsPage(
  offset: number
): Promise<{ items: StressTestProject[]; total: number }> {
  return serverFetchPage<StressTestProject>(
    `/projects?limit=${PROJECTS_PAGE_SIZE}&offset=${offset}`
  );
}

export async function getProject(projectId: string): Promise<StressTestProject | null> {
  try {
    return await serverFetch<StressTestProject>(`/projects/${projectId}`);
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
}

export async function getProjectSummary(projectId: string) {
  const [runs, timeline] = await Promise.all([
    serverFetch<StressTestRun[]>(`/projects/${projectId}/runs`),
    serverFetch<TimelineEntry[]>(`/projects/${projectId}/timeline`),
  ]);

  const criticalCount = timeline.reduce((sum, t) => sum + t.critical_count, 0);
  const majorCount = timeline.reduce((sum, t) => sum + t.major_count, 0);
  const minorCount = timeline.reduce((sum, t) => sum + t.minor_count, 0);
  const findingCount = criticalCount + majorCount + minorCount;
  const resolvedCount = timeline.reduce((sum, t) => sum + t.resolved_count, 0);

  return {
    runCount: runs.length,
    findingCount,
    criticalCount,
    majorCount,
    minorCount,
    latestRun: runs.at(-1) ?? null,
    allResolved: findingCount > 0 && resolvedCount === findingCount,
  };
}
