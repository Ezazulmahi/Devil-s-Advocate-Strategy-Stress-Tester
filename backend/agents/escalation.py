from langchain_core.prompts import ChatPromptTemplate

from agents.personas.prompts import SYSTEM_PROMPTS
from agents.schemas import EscalationResult
from llm import get_llm
from models.finding import Finding
from models.rebuttal import Rebuttal

_ESCALATION_INSTRUCTIONS = (
    "\n\nYou are now in a live back-and-forth defending your original finding against the "
    "submitter's rebuttal. Stay fully in character. If their defense is backed by real evidence "
    "and fully addresses the concern, concede. If it's backed by real but incomplete evidence, "
    "stand your ground while acknowledging progress. If it's a weak, hand-wavy, or evasive "
    "defense, escalate and push harder — exactly like a real investor, attacker, or reviewer "
    "would. Never concede just to be polite."
)

_HUMAN_TEMPLATE = """ORIGINAL FINDING
Title: {title}
Severity: {severity}
Description: {description}

REBUTTAL THREAD SO FAR
{thread}

LATEST REBUTTAL FROM THE SUBMITTER
{user_response}

Respond in character with your verdict, counter-response, and (if warranted) a new severity."""


def escalate_finding(
    finding: Finding, rebuttal_history: list[Rebuttal], user_response: str
) -> EscalationResult:
    system_prompt = SYSTEM_PROMPTS[finding.persona] + _ESCALATION_INSTRUCTIONS

    thread_lines = []
    for r in rebuttal_history:
        thread_lines.append(f"Submitter: {r.user_response}")
        if r.persona_counter_response:
            thread_lines.append(f"You: {r.persona_counter_response}")
    thread = "\n".join(thread_lines) if thread_lines else "(no prior rounds — this is round 1)"

    prompt = ChatPromptTemplate.from_messages(
        [("system", system_prompt), ("human", _HUMAN_TEMPLATE)]
    )
    chain = prompt | get_llm(temperature=0.6).with_structured_output(EscalationResult)

    return chain.invoke(
        {
            "title": finding.title,
            "severity": finding.severity.value,
            "description": finding.description,
            "thread": thread,
            "user_response": user_response,
        }
    )
