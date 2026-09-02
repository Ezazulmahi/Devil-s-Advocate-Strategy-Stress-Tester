import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.enums import PersonaId

if TYPE_CHECKING:
    from models.finding import Finding
    from models.run import StressTestRun


class PersonaFinding(Base):
    __tablename__ = "persona_findings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stress_test_runs.id", ondelete="CASCADE"), nullable=False
    )
    persona: Mapped[PersonaId] = mapped_column(Enum(PersonaId, name="persona_id"), nullable=False)
    raw_output: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    run: Mapped["StressTestRun"] = relationship(back_populates="persona_findings")
    findings: Mapped[list["Finding"]] = relationship(back_populates="persona_finding")
