from typing import Literal

from pydantic import BaseModel, Field

from models.enums import PersonaId, Severity


class AggregatedFinding(BaseModel):
    persona: PersonaId = Field(description="Which persona raised this finding")
    severity: Severity = Field(description="critical, major, or minor")
    category: str = Field(description="Short category label, e.g. 'Unit Economics', 'Secrets Management'")
    title: str = Field(description="A short, specific title for the finding, under 12 words")
    description: str = Field(description="2-4 sentences explaining exactly what is wrong and why it matters")
    suggested_fix: str = Field(description="A concrete, actionable fix — not just criticism")


class AggregatedFindingsList(BaseModel):
    findings: list[AggregatedFinding] = Field(
        description="Deduplicated, ranked findings across all personas. Merge near-duplicate points "
        "raised by multiple personas into a single finding rather than listing both."
    )


class EscalationResult(BaseModel):
    verdict: Literal["escalate", "concede", "stand"] = Field(
        description="'concede' if the rebuttal fully resolves the finding, 'escalate' if the persona "
        "should push back harder, 'stand' if the rebuttal helps but the concern isn't fully resolved"
    )
    counter_response: str = Field(
        description="The persona's in-character reply to the user's rebuttal, 2-5 sentences"
    )
    new_severity: Severity | None = Field(
        default=None,
        description="Set only if the rebuttal justifies downgrading severity (e.g. critical -> major). "
        "Leave null if severity is unchanged.",
    )
