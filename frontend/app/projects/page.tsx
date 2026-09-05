import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProjectListRow from "@/components/ProjectListRow";
import { getProjects, getProjectSummary } from "@/controllers/projects";

export default async function ProjectsPage() {
  const projects = await getProjects();
  const rows = await Promise.all(
    projects.map(async (project) => ({
      project,
      summary: await getProjectSummary(project.id),
    }))
  );

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>All Projects</h1>
          <p className="subtext">
            Every plan, pitch, and codebase you&apos;ve put in front of a persona
          </p>
        </div>
        <Link href="/projects/new" className="btn btn-red">
          + New Stress Test
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="subtext">No projects yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map(({ project, summary }) => (
            <ProjectListRow
              key={project.id}
              project={project}
              runCount={summary.runCount}
              criticalCount={summary.criticalCount}
              majorCount={summary.majorCount}
              minorCount={summary.minorCount}
              latestRun={summary.latestRun}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
