from app.models import Job
from app.schemas.job import JobDetailResponse, ResumeVariantOut, RoadmapOut
from app.services.pipeline import latest_resume_and_roadmap


def job_to_detail(job: Job) -> JobDetailResponse:
    rv, rm = latest_resume_and_roadmap(job)
    return JobDetailResponse(
        id=job.id,
        source_url=job.source_url,
        title=job.title,
        company=job.company,
        clean_text=job.clean_text,
        extracted=job.extracted,
        fit_assessment=job.fit_assessment,
        extraction_version=job.extraction_version,
        resume_variant=ResumeVariantOut.model_validate(rv) if rv else None,
        roadmap=RoadmapOut.model_validate(rm) if rm else None,
    )
