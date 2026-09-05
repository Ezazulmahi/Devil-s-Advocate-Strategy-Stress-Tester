import "server-only";

import { serverFetch } from "@/lib/server-api";
import type { TimelineEntry } from "@/models/types";

export async function getTimeline(projectId: string): Promise<TimelineEntry[]> {
  return serverFetch<TimelineEntry[]>(`/projects/${projectId}/timeline`);
}
