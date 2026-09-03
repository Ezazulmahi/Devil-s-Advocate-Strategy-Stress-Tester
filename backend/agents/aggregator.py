from langchain_core.prompts import ChatPromptTemplate

from agents.schemas import AggregatedFinding, AggregatedFindingsList
from llm import get_llm
from models.enums import PersonaId
from models.project import StressTestProject

_SYSTEM_PROMPT = (
    "You are the aggregator for a multi-persona adversarial critique platform. You are given raw "
    "critiques from several independent personas who each attacked the same submission from a "
    "different angle. Your job: deduplicate overlapping points (if two personas raised "
    "essentially the same issue, merge them into ONE finding and keep whichever persona's framing "
    "is sharpest), assign each surviving finding a severity (critical = invalidates the core "
    "premise or is a severe security/compliance risk; major = a serious weakness that must be "
    "addressed; minor = worth fixing but not blocking), and give each one a concrete, actionable "
    "suggested fix. Rank nothing here — the caller sorts by severity. Do not invent findings that "
    "aren't grounded in the critiques you were given."
)

_HUMAN_TEMPLATE = """Project: {title} ({input_type})

{persona_sections}

Deduplicate, assign severity, and structure every distinct finding above into the required schema."""


def aggregate_findings(
    project: StressTestProject, persona_outputs: dict[PersonaId, str]
) -> list[AggregatedFinding]:
    persona_sections = "\n\n".join(
        f"=== {persona_id.value.upper()} PERSONA RAW CRITIQUE ===\n{text}"
        for persona_id, text in persona_outputs.items()
    )

    prompt = ChatPromptTemplate.from_messages(
        [("system", _SYSTEM_PROMPT), ("human", _HUMAN_TEMPLATE)]
    )
    chain = prompt | get_llm(temperature=0.2).with_structured_output(AggregatedFindingsList)

    result: AggregatedFindingsList = chain.invoke(
        {
            "title": project.title,
            "input_type": project.input_type.value,
            "persona_sections": persona_sections,
        }
    )
    return result.findings
