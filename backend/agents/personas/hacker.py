import chromadb

from agents.personas.prompts import RAG_QUERIES
from agents.personas.runner import run_persona_critique
from agents.rag.store import retrieve
from agents.static_scan import format_static_findings, run_static_scan
from models.enums import PersonaId
from models.project import StressTestProject


def run(project: StressTestProject, collection: chromadb.Collection) -> str:
    context_chunks = retrieve(collection, RAG_QUERIES[PersonaId.hacker])
    static_findings = run_static_scan(project.raw_input)

    return run_persona_critique(
        PersonaId.hacker,
        project,
        context_chunks,
        extra_context=format_static_findings(static_findings),
        extra_context_label="STATIC ANALYSIS SCAN RESULTS",
    )
