from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_session
from app.models import Application, Job, User
from app.schemas.job import JobDetailResponse, JobIngestRequest, TrackJobRequest
from app.services.dedup import dedupe_job_rows_prefer_newest
from app.services.pipeline import DuplicateIngestError, get_job_for_user, ingest_job
from app.api.v1.jobs_helpers import job_to_detail

router = APIRouter(prefix="/jobs", tags=["jobs"])

_ALLOWED_TRACK = frozenset(
    {"wishlist", "applied", "phone_screen", "interview", "offer", "rejected", "accepted"}
)


@router.post("/ingest", response_model=JobDetailResponse, status_code=status.HTTP_201_CREATED)
async def ingest(
    body: JobIngestRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> JobDetailResponse:
    try:
        job, _res, _rm = await ingest_job(session, user, body)
    except DuplicateIngestError as dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "duplicate_job",
                "job_id": str(dup.job_id),
                "match": dup.match,
                "message": "This job posting is already in your library.",
            },
        ) from dup
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e)) from e
    await session.refresh(job)
    loaded = await get_job_for_user(session, user.id, job.id)
    assert loaded is not None
    return job_to_detail(loaded)


@router.get("", response_model=list[JobDetailResponse])
async def list_jobs(
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[JobDetailResponse]:
    result = await session.execute(
        select(Job)
        .where(Job.user_id == user.id)
        .order_by(Job.created_at.desc())
    )
    jobs = result.scalars().all()
    jobs = dedupe_job_rows_prefer_newest(jobs)
    out: list[JobDetailResponse] = []
    for j in jobs:
        full = await get_job_for_user(session, user.id, j.id)
        if full:
            out.append(job_to_detail(full))
    return out


@router.get("/{job_id}", response_model=JobDetailResponse)
async def get_job(
    job_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> JobDetailResponse:
    job = await get_job_for_user(session, user.id, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job_to_detail(job)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> None:
    job = await get_job_for_user(session, user.id, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    await session.delete(job)


@router.post("/{job_id}/track", status_code=status.HTTP_201_CREATED)
async def track_job(
    job_id: UUID,
    body: TrackJobRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    if body.status not in _ALLOWED_TRACK:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
    job = await get_job_for_user(session, user.id, job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    result = await session.execute(
        select(Application).where(Application.user_id == user.id, Application.job_id == job_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.status = body.status
        await session.flush()
        return {"id": str(existing.id), "job_id": str(job_id), "status": existing.status}

    app = Application(user_id=user.id, job_id=job_id, status=body.status)
    session.add(app)
    await session.flush()
    return {"id": str(app.id), "job_id": str(job_id), "status": app.status}
