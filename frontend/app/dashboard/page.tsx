import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProjectCard from "@/components/ProjectCard";
import { getProjects, getProjectSummary } from "@/controllers/projects";

export default async function DashboardPage() {
  const projects = await getProjects();
  const summaries = await Promise.all(
    projects.map(async (project) => ({
      project,
      summary: await getProjectSummary(project.id),
    }))
  );
  const activeRuns = summaries.filter(
    ({ summary }) => summary.latestRun?.status === "running" || summary.latestRun?.status === "pending"
  ).length;

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Case Files</h1>
          <p className="subtext">
            {projects.length} project{projects.length === 1 ? "" : "s"} · {activeRuns} active
            simulation{activeRuns === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/projects/new" className="btn btn-red">
          + New Stress Test
        </Link>
      </div>
      {projects.length === 0 ? (
        <div className="project-card" style={{ cursor: "default", textAlign: "center", padding: 48 }}>
          <p style={{ marginBottom: 16 }}>
            No case files yet. Submit your first plan, pitch, or codebase to get attacked.
          </p>
          <Link href="/projects/new" className="btn btn-red">
            + New Stress Test
          </Link>
        </div>
      ) : (
        <div className="project-grid">
          {summaries.map(({ project, summary }) => (
            <ProjectCard
              key={project.id}
              project={project}
              runCount={summary.runCount}
              findingCount={summary.findingCount}
              criticalCount={summary.criticalCount}
              majorCount={summary.majorCount}
              latestRun={summary.latestRun}
              allResolved={summary.allResolved}
            />
          ))}
          <Link href="/projects/new" className="project-card new-card">
            <span style={{ fontSize: 22 }}>+</span>Start a new stress test
          </Link>
        </div>
      )}
    </AppShell>
  );
}
