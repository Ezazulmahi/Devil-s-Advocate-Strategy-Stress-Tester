import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import SimulationView from "@/components/SimulationView";
import { getRunWithProject, getDialogue } from "@/controllers/runs";
import { getPersona } from "@/controllers/personas";

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ projectId: string; runId: string }>;
}) {
  const { runId } = await params;
  const context = await getRunWithProject(runId);
  if (!context || !context.project) notFound();
  const { run, project } = context;

  const dialogue = await getDialogue(run.id);
  const personaId =
    dialogue.find((turn) => turn.personaId)?.personaId ??
    run.personasUsed[0] ??
    "investor";
  const persona = await getPersona(personaId);
  if (!persona) notFound();

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>{project.title}</h1>
          <p className="subtext">
            {run.status === "running" ? "Simulation in progress" : "Simulation replay"} ·{" "}
            {persona.name} persona
          </p>
        </div>
        <Link href={`/projects/${project.id}/runs/${run.id}`} className="btn btn-ghost">
          {run.status === "running" ? "Pause" : "View results"}
        </Link>
      </div>
      <SimulationView
        runId={run.id}
        initialDialogue={dialogue}
        persona={persona}
        round={dialogue.length > 0 ? "Round 2 of 3 — Escalation" : "Round 1 — Opening"}
      />
    </AppShell>
  );
}
