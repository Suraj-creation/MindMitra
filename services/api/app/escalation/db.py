"""ORM table for alerts."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base


class AlertORM(Base):
    __tablename__ = "alerts"

    alert_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    person_id: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    domain: Mapped[str] = mapped_column(String(64), nullable=False)
    level: Mapped[str] = mapped_column(String(4), nullable=False)  # L1..L5
    z: Mapped[float] = mapped_column(Float, nullable=False)
    persistence_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reason_codes: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="open")  # open|acknowledged
    feedback: Mapped[str | None] = mapped_column(String(24), nullable=True)  # useful|expected|not_useful
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
