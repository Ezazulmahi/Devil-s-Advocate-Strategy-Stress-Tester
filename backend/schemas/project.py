import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from models.enums import InputType, PersonaId


class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    input_type: InputType | None = Field(
        default=None, description="Omit to auto-detect from raw_input"
    )
    raw_input: str = Field(min_length=1)


class ProjectFromRepoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    repo_url: str = Field(min_length=1)


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    input_type: InputType
    raw_input: str
    created_at: datetime


class InputTypeDetectRequest(BaseModel):
    raw_input: str = Field(min_length=1)


class InputTypeDetectResponse(BaseModel):
    input_type: InputType
    suggested_personas: list[PersonaId]
