import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import FindingDetailView from "@/components/FindingDetailView";
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

  const persona = await getPersona(finding.persona);
  const rebuttals = await getRebuttals(finding.id);

  return (
    <AppShell>
      <FindingDetailView
        initialFinding={finding}
        initialRebuttals={rebuttals}
        personaName={persona?.name ?? "Persona"}
      />
    </AppShell>
  );
}
