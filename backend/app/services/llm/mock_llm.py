from app.schemas.pipeline import (
    FitAssessment,
    FitDimension,
    FitGap,
    JobExtraction,
    PipelineLLMResult,
    RoadmapPlan,
)
from app.services.llm.base import LLMService


class MockLLMService(LLMService):
    async def run_job_pipeline(
        self,
        *,
        job_text: str,
        source_url: str | None,
        master_resume: str,
    ) -> PipelineLLMResult:
        excerpt = job_text[:800] + ("…" if len(job_text) > 800 else "")
        extraction = JobExtraction(
            company="Example Corp",
            title="Software Engineer",
            location="Remote",
            summary="Mock extraction from posting excerpt. Set LLM_PROVIDER=chat for a real model.",
            responsibilities=["Build features", "Review code"],
            requirements_must_have=["Python", "PostgreSQL"],
            requirements_nice_to_have=["FastAPI"],
            tech_stack=["python", "postgres"],
            source_url=source_url,
            confidence={"overall": 0.5, "notes": "mock provider"},
        )
        fit = FitAssessment(
            overall_score=72,
            dimensions=[
                FitDimension(
                    id="stack_overlap",
                    label="Stack overlap",
                    score=80,
                    weight=0.3,
                    evidence=["Python appears in posting and profile overlap."],
                ),
                FitDimension(
                    id="must_have_coverage",
                    label="Must-have coverage",
                    score=65,
                    weight=0.35,
                    evidence=["Some gaps may exist — mock data."],
                ),
            ],
            gaps=[
                FitGap(skill="Kubernetes", severity="low", source="requirements_must_have"),
            ],
            strengths=["Backend alignment in mock scenario."],
        )
        resume = (
            f"# Mock resume variant\n\n"
            f"Summary tailored from master profile length {len(master_resume)} chars "
            f"and posting excerpt below.\n\n"
            f"## Posting excerpt\n{excerpt}\n"
        )
        roadmap = RoadmapPlan(
            horizon_weeks=4,
            priority_skills=[
                {
                    "skill": "Deepen PostgreSQL",
                    "rationale": "Frequently listed in target roles",
                    "milestones": [{"week": 1, "objectives": ["Indexes and EXPLAIN"], "resources": []}],
                }
            ],
            interview_prep=[{"topic": "System design", "depth": "mid"}],
            risks=["Mock roadmap — set LLM_PROVIDER=chat with Ollama or a cloud endpoint."],
        )
        return PipelineLLMResult(
            extraction=extraction,
            fit=fit,
            resume_plain_text=resume,
            roadmap=roadmap,
        )
