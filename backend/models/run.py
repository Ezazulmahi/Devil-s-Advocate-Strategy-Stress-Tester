import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.enums import RunStatus

if TYPE_CHECKING:
    from models.finding import Finding
    from models.persona_finding import PersonaFinding
    from models.project import StressTestProject


class StressTestRun(Base):
    __tablename__ = "stress_test_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stress_test_projects.id", ondelete="CASCADE"), nullable=False
    )
    personas_used: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[RunStatus] = mapped_column(
        Enum(RunStatus, name="run_status"), nullable=False, default=RunStatus.pending
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped["StressTestProject"] = relationship(back_populates="runs")
    persona_findings: Mapped[list["PersonaFinding"]] = relationship(
        back_populates="run", cascade="all, delete-orphan"
    )
    findings: Mapped[list["Finding"]] = relationship(back_populates="run", cascade="all, delete-orphan")
