from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


_ALLOWED_APP_STATUS = frozenset(
    {"wishlist", "applied", "phone_screen", "interview", "offer", "rejected", "accepted"}
)


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, serialize_by_alias=True)

    id: UUID
    job_id: UUID = Field(serialization_alias="jobId")
    status: str
    applied_at: datetime | None = Field(default=None, serialization_alias="appliedAt")
    notes: str | None = None


class ApplicationUpdate(BaseModel):
    status: str | None = None
    notes: str | None = Field(default=None, max_length=50_000)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if v not in _ALLOWED_APP_STATUS:
            raise ValueError(f"status must be one of {sorted(_ALLOWED_APP_STATUS)}")
        return v
