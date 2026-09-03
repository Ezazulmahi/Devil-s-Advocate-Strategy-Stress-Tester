import chromadb

from agents.personas.prompts import RAG_QUERIES
from agents.personas.runner import run_persona_critique
from agents.rag.store import retrieve
from models.enums import PersonaId
from models.project import StressTestProject


def run(project: StressTestProject, collection: chromadb.Collection) -> str:
    context_chunks = retrieve(collection, RAG_QUERIES[PersonaId.customer])
    return run_persona_critique(PersonaId.customer, project, context_chunks)
