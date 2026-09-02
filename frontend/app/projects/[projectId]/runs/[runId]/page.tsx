import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
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

  const findings = await getFindingsForRun(run.id);
  const allPersonas = await getPersonas();
  const personas = allPersonas.filter((p) => run.personasUsed.includes(p.id));

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Results — {project.title}</h1>
          <p className="subtext">
            Run #{run.runNumber} · {run.status} · {findings.length} finding
            {findings.length === 1 ? "" : "s"} across {personas.length} persona
            {personas.length === 1 ? "" : "s"}
          </p>
        </div>
        <button type="button" className="btn btn-ghost">
          Export Report
        </button>
      </div>
      <ResultsView findings={findings} personas={personas} />
    </AppShell>
  );
}
