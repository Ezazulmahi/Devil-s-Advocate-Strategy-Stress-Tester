import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import RunProgressView from "@/components/RunProgressView";
import { getRunWithProject } from "@/controllers/runs";

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ projectId: string; runId: string }>;
}) {
  const { runId } = await params;
  const context = await getRunWithProject(runId);
  if (!context || !context.project) notFound();
  const { run, project } = context;

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>{project.title}</h1>
          <p className="subtext">Stress test in progress</p>
        </div>
        <Link href={`/projects/${project.id}/runs/${run.id}`} className="btn btn-ghost">
          View results
        </Link>
      </div>
      <RunProgressView
        projectId={project.id}
        runId={run.id}
        personasUsed={run.personas_used}
        initialStatus={run.status}
      />
    </AppShell>
  );
}
