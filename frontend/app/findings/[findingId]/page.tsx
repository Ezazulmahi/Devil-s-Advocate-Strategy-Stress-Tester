import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import RebuttalThread from "@/components/RebuttalThread";
import { getFindingContext, getRebuttals } from "@/controllers/findings";
import { getPersona } from "@/controllers/personas";

export default async function FindingDetailPage({
  params,
}: {
  params: Promise<{ findingId: string }>;
}) {
  const { findingId } = await params;
  const context = await getFindingContext(findingId);
  if (!context) notFound();
  const { finding } = context;

  const persona = await getPersona(finding.personaId);
  const rebuttals = await getRebuttals(finding.id);
  const round = rebuttals.length + 1;

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1 style={{ fontSize: 18 }}>
            Finding — {finding.title}
          </h1>
          <p className="subtext">
            {persona?.name ?? finding.personaId} ·{" "}
            {finding.severity[0].toUpperCase() + finding.severity.slice(1)} · Round {round}
          </p>
        </div>
        <span className={`stamp-badge stamp-${finding.severity}`}>
          {finding.severity[0].toUpperCase() + finding.severity.slice(1)}
        </span>
      </div>

      <div className="finding-detail">
        <h2>Original Finding</h2>
        <p>{finding.description}</p>
      </div>

      <RebuttalThread
        findingId={finding.id}
        initialRebuttals={rebuttals}
        personaName={persona?.name ?? "Persona"}
      />
    </AppShell>
  );
}
