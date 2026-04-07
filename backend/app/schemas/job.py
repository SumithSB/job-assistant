from __future__ import annotations

from typing import Any, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class JobIngestRequest(BaseModel):
    url: str | None = Field(default=None, max_length=2048)
    pasted_text: str | None = Field(default=None, max_length=1_000_000)

    @model_validator(mode="after")
    def require_url_or_text(self) -> Self:
        if not self.url and not (self.pasted_text and self.pasted_text.strip()):
            raise ValueError("Provide url or pasted_text")
        return self


class ResumeVariantOut(BaseModel):
    id: UUID
    content: str
    profile_version_used: int

    model_config = {"from_attributes": True}


class RoadmapOut(BaseModel):
    id: UUID
    plan: dict[str, Any]

    model_config = {"from_attributes": True}


class JobDetailResponse(BaseModel):
    id: UUID
    source_url: str | None = Field(default=None, serialization_alias="sourceUrl")
    title: str
    company: str
    clean_text: str
    extracted: dict[str, Any] | None
    fit_assessment: dict[str, Any] | None
    extraction_version: int
    resume_variant: ResumeVariantOut | None = None
    roadmap: RoadmapOut | None = None

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        serialize_by_alias=True,
    )


class TrackJobRequest(BaseModel):
    status: str = "wishlist"
