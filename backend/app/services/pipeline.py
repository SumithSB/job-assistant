from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Job, ResumeVariant, Roadmap, User, UserProfile
from app.schemas.job import JobIngestRequest
from app.services.dedup import (
    canonicalize_source_url,
    find_duplicate_job_for_user,
    ingest_text_fingerprint,
)
from app.services.ingest import fetch_url_text
from app.services.llm import get_llm_service


class DuplicateIngestError(Exception):
    """Raised when the same posting was already ingested (before running the LLM)."""

    def __init__(self, job_id: UUID, *, match: str) -> None:
        self.job_id = job_id
        self.match = match  # "url" or "content"
        super().__init__(str(job_id))


async def get_or_create_profile(session: AsyncSession, user: User) -> UserProfile:
    result = await session.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(user_id=user.id, master_resume_text="")
        session.add(profile)
        await session.flush()
    return profile


async def ingest_job(
    session: AsyncSession,
    user: User,
    body: JobIngestRequest,
) -> tuple[Job, ResumeVariant, Roadmap]:
    profile = await get_or_create_profile(session, user)
    url_canonical: str | None = None
    if body.url:
        clean_text, _html, final_url = await fetch_url_text(body.url)
        source_url = body.url.strip()
        url_canonical = canonicalize_source_url(final_url)
    else:
        clean_text = (body.pasted_text or "").strip()
        source_url = None

    if not clean_text:
        raise ValueError("No job description text could be used (empty paste or extract)")

    text_fp = ingest_text_fingerprint(clean_text)
    dup = await find_duplicate_job_for_user(
        session,
        user.id,
        source_url_canonical=url_canonical,
        text_fingerprint=text_fp,
    )
    if dup is not None:
        if (
            url_canonical
            and dup.source_url_canonical
            and dup.source_url_canonical == url_canonical
        ):
            match = "url"
        else:
            match = "content"
        raise DuplicateIngestError(dup.id, match=match)

    llm = get_llm_service()
    result = await llm.run_job_pipeline(
        job_text=clean_text,
        source_url=source_url,
        master_resume=profile.master_resume_text,
    )

    job = Job(
        user_id=user.id,
        source_url=source_url,
        source_url_canonical=url_canonical,
        ingest_text_fingerprint=text_fp,
        clean_text=clean_text,
        extracted=result.extraction.model_dump(mode="json"),
        fit_assessment=result.fit.model_dump(mode="json"),
        extraction_version=1,
        title=result.extraction.title or "Untitled role",
        company=result.extraction.company or "Unknown company",
    )
    session.add(job)
    await session.flush()

    resume = ResumeVariant(
        user_id=user.id,
        job_id=job.id,
        content=result.resume_plain_text,
        profile_version_used=1,
    )
    roadmap = Roadmap(
        user_id=user.id,
        job_id=job.id,
        plan=result.roadmap.model_dump(mode="json"),
    )
    session.add(resume)
    session.add(roadmap)
    await session.flush()
    return job, resume, roadmap


async def get_job_for_user(
    session: AsyncSession,
    user_id: UUID,
    job_id: UUID,
) -> Job | None:
    result = await session.execute(
        select(Job)
        .options(selectinload(Job.resume_variants), selectinload(Job.roadmaps))
        .where(Job.id == job_id, Job.user_id == user_id)
    )
    return result.scalar_one_or_none()


def latest_resume_and_roadmap(job: Job) -> tuple[ResumeVariant | None, Roadmap | None]:
    resumes = sorted(job.resume_variants, key=lambda r: r.created_at, reverse=True)
    roads = sorted(job.roadmaps, key=lambda r: r.created_at, reverse=True)
    return (resumes[0] if resumes else None, roads[0] if roads else None)
