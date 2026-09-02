import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.enums import FindingStatus, PersonaId, Severity

if TYPE_CHECKING:
    from models.persona_finding import PersonaFinding
    from models.rebuttal import Rebuttal
    from models.run import StressTestRun


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("stress_test_runs.id", ondelete="CASCADE"), nullable=False
    )
    persona_finding_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("persona_findings.id", ondelete="CASCADE"), nullable=False
    )
    persona: Mapped[PersonaId] = mapped_column(Enum(PersonaId, name="persona_id"), nullable=False)
    severity: Mapped[Severity] = mapped_column(Enum(Severity, name="severity"), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_fix: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[FindingStatus] = mapped_column(
        Enum(FindingStatus, name="finding_status"), nullable=False, default=FindingStatus.open
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    run: Mapped["StressTestRun"] = relationship(back_populates="findings")
    persona_finding: Mapped["PersonaFinding"] = relationship(back_populates="findings")
    rebuttals: Mapped[list["Rebuttal"]] = relationship(
        back_populates="finding", cascade="all, delete-orphan", order_by="Rebuttal.created_at"
    )
