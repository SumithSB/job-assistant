import uuid

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin
from app.models.user import User


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    source_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    source_url_canonical: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    ingest_text_fingerprint: Mapped[str | None] = mapped_column(String(64), nullable=True)
    clean_text: Mapped[str] = mapped_column(Text, nullable=False)
    extracted: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    fit_assessment: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    extraction_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    title: Mapped[str] = mapped_column(String(512), default="", nullable=False)
    company: Mapped[str] = mapped_column(String(512), default="", nullable=False)

    user: Mapped[User] = relationship(back_populates="jobs", foreign_keys=[user_id])
    resume_variants = relationship("ResumeVariant", back_populates="job")
    roadmaps = relationship("Roadmap", back_populates="job")
    applications = relationship("Application", back_populates="job")
