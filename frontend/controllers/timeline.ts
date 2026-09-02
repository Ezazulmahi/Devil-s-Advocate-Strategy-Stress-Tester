import { TIMELINE } from "@/lib/mock-data";
import type { TimelineEntry } from "@/models/types";

export async function getTimeline(projectId: string): Promise<TimelineEntry[]> {
  return TIMELINE.filter((t) => t.projectId === projectId);
}
