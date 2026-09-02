import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.enums import PersonaId, RunStatus


class RunCreate(BaseModel):
    personas: list[PersonaId]


class RunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    personas_used: list[str]
    status: RunStatus
    created_at: datetime
    completed_at: datetime | None
