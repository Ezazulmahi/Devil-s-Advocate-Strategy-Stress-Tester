import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProjectListRow from "@/components/ProjectListRow";
import { PROJECTS_PAGE_SIZE, getProjectSummary, getProjectsPage } from "@/controllers/projects";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ offset?: string }>;
}) {
  const { offset: offsetParam } = await searchParams;
  const offset = Math.max(0, Number(offsetParam ?? 0) || 0);

  const { items: projects, total } = await getProjectsPage(offset);
  const rows = await Promise.all(
    projects.map(async (project) => ({
      project,
      summary: await getProjectSummary(project.id),
    }))
  );

  const hasPrev = offset > 0;
  const hasNext = offset + projects.length < total;
  const prevOffset = Math.max(0, offset - PROJECTS_PAGE_SIZE);
  const nextOffset = offset + PROJECTS_PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = offset + projects.length;

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
        <>
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

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <span className="subtext" style={{ marginTop: 0 }}>
              {rangeStart}–{rangeEnd} of {total}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href={`/projects?offset=${prevOffset}`}
                className="btn btn-ghost"
                aria-disabled={!hasPrev}
                style={!hasPrev ? { pointerEvents: "none", opacity: 0.4 } : undefined}
              >
                ← Previous
              </Link>
              <Link
                href={`/projects?offset=${nextOffset}`}
                className="btn btn-ghost"
                aria-disabled={!hasNext}
                style={!hasNext ? { pointerEvents: "none", opacity: 0.4 } : undefined}
              >
                Next →
              </Link>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
