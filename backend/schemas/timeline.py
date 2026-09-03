import uuid
from datetime import datetime

from pydantic import BaseModel

from models.enums import RunStatus


class TimelineEntry(BaseModel):
    run_id: uuid.UUID
    run_number: int
    status: RunStatus
    created_at: datetime
    completed_at: datetime | None
    critical_count: int
    major_count: int
    minor_count: int
    resolved_count: int
    downgraded_count: int
