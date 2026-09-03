from collections.abc import Callable

import chromadb

from agents.personas import academic, competitor, customer, hacker, investor
from models.enums import PersonaId
from models.project import StressTestProject

PERSONA_RUNNERS: dict[PersonaId, Callable[[StressTestProject, chromadb.Collection], str]] = {
    PersonaId.competitor: competitor.run,
    PersonaId.investor: investor.run,
    PersonaId.hacker: hacker.run,
    PersonaId.customer: customer.run,
    PersonaId.academic: academic.run,
}
