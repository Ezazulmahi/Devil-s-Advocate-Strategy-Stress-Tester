import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RebuttalCreate(BaseModel):
    user_response: str = Field(min_length=1)


class RebuttalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    finding_id: uuid.UUID
    user_response: str
    persona_counter_response: str | None
    created_at: datetime
