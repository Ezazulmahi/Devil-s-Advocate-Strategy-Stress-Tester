import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import RunAgainForm from "@/components/RunAgainForm";
import { getProject } from "@/controllers/projects";
import { getTimeline } from "@/controllers/timeline";
import { getRunsForProject } from "@/controllers/runs";

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const [entries, runs] = await Promise.all([
    getTimeline(projectId),
    getRunsForProject(projectId),
  ]);
  const lastPersonas = runs.at(-1)?.personas_used ?? ["competitor", "investor", "customer"];

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Iteration History</h1>
          <p className="subtext">
            {project.title} — {entries.length} run{entries.length === 1 ? "" : "s"}
          </p>
        </div>
        <RunAgainForm projectId={projectId} defaultPersonas={lastPersonas} />
      </div>
      {entries.length === 0 ? (
        <p className="subtext">No stress-test runs yet for this project.</p>
      ) : (
        <div className="timeline">
          {[...entries].reverse().map((entry) => {
            const isMilestone = entry.resolved_count > 0 || entry.downgraded_count > 0;
            const href =
              entry.status === "completed" || entry.status === "failed"
                ? `/projects/${projectId}/runs/${entry.run_id}`
                : `/projects/${projectId}/runs/${entry.run_id}/simulation`;
            return (
              <div key={entry.run_id} className={`tl-item${isMilestone ? " resolved" : ""}`}>
                <Link href={href} className="tl-card" style={{ display: "block", textDecoration: "none" }}>
                  <div className="tl-date">
                    Run #{entry.run_number} · {entry.created_at.slice(0, 10)}
                  </div>
                  <h4>
                    {entry.status === "completed"
                      ? "Completed"
                      : entry.status === "failed"
                        ? "Failed"
                        : entry.status === "running"
                          ? "Running…"
                          : "Queued"}
                  </h4>
                  <p>
                    {entry.resolved_count > 0 &&
                      `${entry.resolved_count} previously-flagged finding${entry.resolved_count === 1 ? "" : "s"} resolved. `}
                    {entry.downgraded_count > 0 &&
                      `${entry.downgraded_count} downgraded after a rebuttal. `}
                    {entry.resolved_count === 0 && entry.downgraded_count === 0 && entry.status === "completed" &&
                      "No previous findings were resolved in this run."}
                  </p>
                  <div className="tl-stats">
                    {entry.resolved_count > 0 && (
                      <span style={{ color: "var(--green)" }}>{entry.resolved_count} resolved</span>
                    )}
                    <span style={{ color: "var(--red)" }}>{entry.critical_count} critical</span>
                    <span style={{ color: "var(--amber)" }}>{entry.major_count} major</span>
                    {entry.minor_count > 0 && (
                      <span style={{ color: "var(--steel)" }}>{entry.minor_count} minor</span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
