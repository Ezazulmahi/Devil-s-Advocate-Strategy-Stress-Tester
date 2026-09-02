import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProjectCard from "@/components/ProjectCard";
import { getProjects, getProjectSummary } from "@/controllers/projects";
import { getRunsForProject } from "@/controllers/runs";

export default async function DashboardPage() {
  const projects = await getProjects();
  const summaries = await Promise.all(
    projects.map(async (project) => ({
      project,
      summary: await getProjectSummary(project.id),
    }))
  );
  const activeRuns = (
    await Promise.all(
      projects.map((p) => getRunsForProject(p.id))
    )
  )
    .flat()
    .filter((r) => r.status === "running").length;

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
    </AppShell>
  );
}
