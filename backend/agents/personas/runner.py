from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from agents.personas.prompts import CRITIQUE_INSTRUCTIONS, SYSTEM_PROMPTS
from llm import get_llm
from models.enums import PersonaId
from models.project import StressTestProject

_HUMAN_TEMPLATE = """Project title: {title}
Input type: {input_type}

--- RELEVANT EXCERPTS ---
{context}
{extra_context_block}
--- END EXCERPTS ---

{instructions}"""


def run_persona_critique(
    persona_id: PersonaId,
    project: StressTestProject,
    context_chunks: list[str],
    extra_context: str = "",
    extra_context_label: str = "",
) -> str:
    system_prompt = SYSTEM_PROMPTS[persona_id]
    context = "\n\n".join(context_chunks) if context_chunks else project.raw_input

    extra_context_block = ""
    if extra_context:
        extra_context_block = f"\n--- {extra_context_label} ---\n{extra_context}\n"

    prompt = ChatPromptTemplate.from_messages(
        [("system", system_prompt), ("human", _HUMAN_TEMPLATE)]
    )
    chain = prompt | get_llm(temperature=0.7) | StrOutputParser()

    return chain.invoke(
        {
            "title": project.title,
            "input_type": project.input_type.value,
            "context": context,
            "extra_context_block": extra_context_block,
            "instructions": CRITIQUE_INSTRUCTIONS,
        }
    )
