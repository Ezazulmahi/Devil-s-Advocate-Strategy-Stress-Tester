import re

from models.enums import InputType, PersonaId

_CODE_TOKENS = re.compile(
    r"\bdef \w+\(|\bfunction \w*\(|\bclass \w+[:({]|\bimport \w+|\bconst \w+ ?=|"
    r"#include|\bpublic (class|static)|=>|;\s*$|^\s*(if|for|while)\s*\(",
    re.MULTILINE,
)

_RESEARCH_TOKENS = re.compile(
    r"\babstract\b|\bmethodology\b|\bhypothesis\b|\bet al\.|\breferences\b|\bdataset\b|"
    r"\bp\s*[<=]\s*0\.\d+|\bstatistically significant\b|\bliterature review\b",
    re.IGNORECASE,
)

_BUSINESS_PLAN_TOKENS = re.compile(
    r"##|\bexecutive summary\b|\bmarket analysis\b|\bfinancial projections\b|"
    r"\bmission statement\b|\btable of contents\b",
    re.IGNORECASE,
)

DEFAULT_PERSONAS: dict[InputType, list[PersonaId]] = {
    InputType.codebase: [PersonaId.hacker],
    InputType.research_paper: [PersonaId.academic],
    InputType.business_plan: [PersonaId.competitor, PersonaId.investor, PersonaId.customer],
    InputType.pitch: [PersonaId.competitor, PersonaId.investor, PersonaId.customer],
}


def detect_input_type(raw_input: str) -> InputType:
    code_hits = len(_CODE_TOKENS.findall(raw_input))
    if code_hits >= 2:
        return InputType.codebase

    if _RESEARCH_TOKENS.search(raw_input):
        return InputType.research_paper

    if _BUSINESS_PLAN_TOKENS.search(raw_input) or len(raw_input) > 2000:
        return InputType.business_plan

    return InputType.pitch


def suggested_personas(input_type: InputType) -> list[PersonaId]:
    return DEFAULT_PERSONAS[input_type]
