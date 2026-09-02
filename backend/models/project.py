import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base
from models.enums import InputType

if TYPE_CHECKING:
    from models.run import StressTestRun
    from models.user import User


class StressTestProject(Base):
    __tablename__ = "stress_test_projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    input_type: Mapped[InputType] = mapped_column(Enum(InputType, name="input_type"), nullable=False)
    raw_input: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship(back_populates="projects")
    runs: Mapped[list["StressTestRun"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", order_by="StressTestRun.created_at"
    )
