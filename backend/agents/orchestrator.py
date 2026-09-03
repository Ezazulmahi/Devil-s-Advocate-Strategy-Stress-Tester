from langchain_core.runnables import RunnableLambda, RunnableParallel

from agents.personas.registry import PERSONA_RUNNERS
from agents.rag.store import build_context_store
from models.enums import PersonaId
from models.project import StressTestProject


def run_personas_parallel(
    project: StressTestProject, persona_ids: list[PersonaId]
) -> dict[PersonaId, str]:
    """Runs every selected persona's critique chain concurrently (LCEL RunnableParallel)."""
    collection = build_context_store(project.raw_input)

    branches = {
        persona_id.value: RunnableLambda(
            lambda _, pid=persona_id: PERSONA_RUNNERS[pid](project, collection)
        )
        for persona_id in persona_ids
    }
    results = RunnableParallel(branches).invoke({})
    return {PersonaId(key): value for key, value in results.items()}
