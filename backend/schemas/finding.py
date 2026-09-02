import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.enums import FindingStatus, PersonaId, Severity


class FindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    run_id: uuid.UUID
    persona_finding_id: uuid.UUID
    persona: PersonaId
    severity: Severity
    category: str
    title: str
    description: str
    suggested_fix: str
    status: FindingStatus
    created_at: datetime
