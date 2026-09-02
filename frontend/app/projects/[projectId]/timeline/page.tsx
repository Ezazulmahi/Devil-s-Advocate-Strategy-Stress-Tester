import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getProject } from "@/controllers/projects";
import { getTimeline } from "@/controllers/timeline";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const entries = await getTimeline(projectId);
  const weekSpan = entries.length > 1 ? Math.ceil((entries.length - 1) * 1.5) + 2 : 1;

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Iteration History</h1>
          <p className="subtext">
            {project.title} — {entries.length} run{entries.length === 1 ? "" : "s"} across ~
            {weekSpan} weeks
          </p>
        </div>
      </div>
      {entries.length === 0 ? (
        <p className="subtext">No stress-test runs yet for this project.</p>
      ) : (
        <div className="timeline">
          {entries.map((entry) => (
            <div key={entry.id} className={`tl-item${entry.isResolvedMilestone ? " resolved" : ""}`}>
              <div className="tl-card">
                <div className="tl-date">
                  Run #{entry.runNumber} · {entry.date}
                </div>
                <h4>{entry.title}</h4>
                <p>{entry.summary}</p>
                <div className="tl-stats">
                  {entry.resolvedCount > 0 && (
                    <span style={{ color: "var(--green)" }}>{entry.resolvedCount} resolved</span>
                  )}
                  <span style={{ color: "var(--red)" }}>{entry.criticalCount} critical</span>
                  <span style={{ color: "var(--amber)" }}>{entry.majorCount} major</span>
                  {entry.minorCount > 0 && (
                    <span style={{ color: "var(--steel)" }}>{entry.minorCount} minor</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
