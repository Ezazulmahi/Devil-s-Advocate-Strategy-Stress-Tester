import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from models.enums import PersonaId, RunStatus


class RunCreate(BaseModel):
    personas: list[PersonaId] = Field(min_length=1)

    @field_validator("personas")
    @classmethod
    def dedupe_personas(cls, value: list[PersonaId]) -> list[PersonaId]:
        return list(dict.fromkeys(value))


class RunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    personas_used: list[str]
    status: RunStatus
    created_at: datetime
    completed_at: datetime | None
