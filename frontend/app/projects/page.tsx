import Link from "next/link";
import AppShell from "@/components/AppShell";
import { getProjects, getProjectSummary } from "@/controllers/projects";

const TYPE_LABELS: Record<string, string> = {
  business_plan: "Business Plan",
  pitch: "Pitch",
  codebase: "Codebase",
  research_paper: "Research Paper",
};

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

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map(({ project, summary }) => (
          <div key={project.id} className="project-card" style={{ display: "block" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 240, flex: 1 }}>
                <span className="type-tag">{TYPE_LABELS[project.inputType]}</span>
                <h3>{project.title}</h3>
                <p style={{ marginBottom: 0 }}>{project.rawInputPreview}</p>
              </div>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                  RUNS
                  <div style={{ fontSize: 16, color: "#fff", marginTop: 2 }}>{summary.runCount}</div>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--red)" }}>
                  CRITICAL
                  <div style={{ fontSize: 16, color: "var(--red)", marginTop: 2 }}>
                    {summary.criticalCount}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--amber)" }}>
                  MAJOR
                  <div style={{ fontSize: 16, color: "var(--amber)", marginTop: 2 }}>
                    {summary.majorCount}
                  </div>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--steel)" }}>
                  MINOR
                  <div style={{ fontSize: 16, color: "var(--steel)", marginTop: 2 }}>
                    {summary.minorCount}
                  </div>
                </div>
              </div>
            </div>

            <div className="meta-row" style={{ marginTop: 16 }}>
              <span>
                Created {project.createdAt}
                {summary.latestRun && ` · last run ${summary.latestRun.createdAt}`}
              </span>
              <div style={{ display: "flex", gap: 8 }}>
                {summary.latestRun && (
                  <Link
                    href={`/projects/${project.id}/runs/${summary.latestRun.id}`}
                    className="btn btn-ghost"
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    View results
                  </Link>
                )}
                <Link
                  href={`/projects/${project.id}/timeline`}
                  className="btn btn-dark"
                  style={{ padding: "6px 12px", fontSize: 12 }}
                >
                  History
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
