"""Structured LLM output for job ingest pipeline (align with job-assistant-pipeline skill)."""

from typing import Any

from pydantic import BaseModel, Field


class CompensationExtract(BaseModel):
    text: str | None = None
    min: float | None = None
    max: float | None = None
    currency: str | None = None


class JobExtraction(BaseModel):
    company: str = ""
    title: str = ""
    location: str | None = None
    employment_type: str | None = None
    seniority: str | None = None
    source_url: str | None = None
    summary: str = ""
    responsibilities: list[str] = Field(default_factory=list)
    requirements_must_have: list[str] = Field(default_factory=list)
    requirements_nice_to_have: list[str] = Field(default_factory=list)
    tech_stack: list[str] = Field(default_factory=list)
    domain_keywords: list[str] = Field(default_factory=list)
    compensation: CompensationExtract | None = None
    education: list[str] = Field(default_factory=list)
    posting_language: str = "unknown"
    confidence: dict[str, Any] = Field(default_factory=dict)


class FitDimension(BaseModel):
    id: str
    label: str
    score: int = Field(ge=0, le=100)
    weight: float = Field(ge=0, le=1)
    evidence: list[str] = Field(default_factory=list)


class FitGap(BaseModel):
    skill: str
    severity: str = "medium"
    source: str = "requirements_must_have"


class FitAssessment(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    scale_min: int = 0
    scale_max: int = 100
    dimensions: list[FitDimension] = Field(default_factory=list)
    gaps: list[FitGap] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)


class RoadmapPlan(BaseModel):
    horizon_weeks: int = 4
    priority_skills: list[dict[str, Any]] = Field(default_factory=list)
    interview_prep: list[dict[str, Any]] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)


class PipelineLLMResult(BaseModel):
    extraction: JobExtraction
    fit: FitAssessment
    resume_plain_text: str
    roadmap: RoadmapPlan
