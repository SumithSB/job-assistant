from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_session
from app.models import User, UserProfile
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services.pipeline import get_or_create_profile

router = APIRouter(prefix="/me", tags=["profile"])


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> ProfileResponse:
    profile = await get_or_create_profile(session, user)
    return ProfileResponse(
        user_id=str(profile.user_id),
        master_resume_text=profile.master_resume_text,
        structured_skills=profile.structured_skills,
        preferences=profile.preferences,
    )


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
    user: Annotated[User, Depends(get_current_user)],
) -> ProfileResponse:
    result = await session.execute(select(UserProfile).where(UserProfile.user_id == user.id))
    profile = result.scalar_one()
    patch = body.model_dump(exclude_unset=True)
    if "master_resume_text" in patch and patch["master_resume_text"] is not None:
        profile.master_resume_text = patch["master_resume_text"]
    if "structured_skills" in patch:
        profile.structured_skills = patch["structured_skills"]
    if "preferences" in patch:
        profile.preferences = patch["preferences"]
    await session.flush()
    return ProfileResponse(
        user_id=str(profile.user_id),
        master_resume_text=profile.master_resume_text,
        structured_skills=profile.structured_skills,
        preferences=profile.preferences,
    )
