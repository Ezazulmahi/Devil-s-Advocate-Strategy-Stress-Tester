import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.enums import InputType


class ProjectCreate(BaseModel):
    title: str
    input_type: InputType
    raw_input: str


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    input_type: InputType
    raw_input: str
    created_at: datetime
