from typing import Any

from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    master_resume_text: str | None = Field(default=None, max_length=500_000)
    structured_skills: dict[str, Any] | None = None
    preferences: dict[str, Any] | None = None


class ProfileResponse(BaseModel):
    user_id: str
    master_resume_text: str
    structured_skills: dict[str, Any] | None
    preferences: dict[str, Any] | None

    model_config = {"from_attributes": True}
