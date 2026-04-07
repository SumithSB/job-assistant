from abc import ABC, abstractmethod

from app.schemas.pipeline import PipelineLLMResult


class LLMService(ABC):
    @abstractmethod
    async def run_job_pipeline(
        self,
        *,
        job_text: str,
        source_url: str | None,
        master_resume: str,
    ) -> PipelineLLMResult:
        """Single structured pass: extraction + fit + resume + roadmap."""
