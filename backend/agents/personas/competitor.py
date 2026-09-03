import chromadb

from agents.market_research import search_competitors
from agents.personas.prompts import RAG_QUERIES
from agents.personas.runner import run_persona_critique
from agents.rag.store import retrieve
from models.enums import PersonaId
from models.project import StressTestProject


def run(project: StressTestProject, collection: chromadb.Collection) -> str:
    context_chunks = retrieve(collection, RAG_QUERIES[PersonaId.competitor])
    market_context = search_competitors(f"{project.title} competitors alternatives pricing")

    return run_persona_critique(
        PersonaId.competitor,
        project,
        context_chunks,
        extra_context=market_context,
        extra_context_label="LIVE COMPETITOR RESEARCH (web search results)",
    )
