import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import ExportReportButton from "@/components/ExportReportButton";
import ResultsView from "@/components/ResultsView";
import { getRunWithProject } from "@/controllers/runs";
import { getFindingsForRun } from "@/controllers/findings";
import { getPersonas } from "@/controllers/personas";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ projectId: string; runId: string }>;
}) {
  const { runId } = await params;
  const context = await getRunWithProject(runId);
  if (!context || !context.project) notFound();
  const { run, project } = context;

  if (run.status === "pending" || run.status === "running") {
    redirect(`/projects/${project.id}/runs/${run.id}/simulation`);
  }

  const findings = await getFindingsForRun(run.id);
  const allPersonas = await getPersonas();
  const personas = allPersonas.filter((p) => run.personas_used.includes(p.id));

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Results — {project.title}</h1>
          <p className="subtext">
            Run from {run.created_at.slice(0, 10)} · {run.status} · {findings.length} finding
            {findings.length === 1 ? "" : "s"} across {personas.length} persona
            {personas.length === 1 ? "" : "s"}
          </p>
        </div>
        {run.status === "completed" && <ExportReportButton runId={run.id} />}
      </div>

      {run.status === "failed" && (
        <div className="case-file">
          <h4>This run failed</h4>
          <p>
            Something went wrong generating this stress test — no findings were produced. Start a
            new run from the project&apos;s timeline to try again.
          </p>
        </div>
      )}

      {run.status === "completed" && <ResultsView findings={findings} personas={personas} />}
    </AppShell>
  );
}
