from fastapi import APIRouter, Depends, HTTPException
from app.models import Participation, ParticipationStatus
from app.services.participation_service import ParticipationService
from app.core.dependencies import get_participation_service
from app.core.auth import get_current_active_member  # We need to know WHO is voting
from app.models import Member
from app.schemas import ParticipationAdminUpdate, ParticipationRead
from sqlmodel import SQLModel
from typing import Optional, List


router = APIRouter()


class VoteRequest(SQLModel):
    status: ParticipationStatus
    comment: Optional[str] = None


@router.post("/matches/{match_id}/vote", response_model=Participation)
def cast_vote(
    match_id: int,
    vote_data: VoteRequest,
    current_member: Member = Depends(get_current_active_member),
    service: ParticipationService = Depends(get_participation_service),
):
    """
    Member casts a vote (Attending/Absent) for a specific match.
    """
    return service.vote(
        match_id, current_member.id, vote_data.status, vote_data.comment
    )


@router.get("/matches/{match_id}/me", response_model=Optional[Participation])
def get_my_vote(
    match_id: int,
    current_member: Member = Depends(get_current_active_member),
    service: ParticipationService = Depends(get_participation_service),
):
    """
    Get the current member's participation status for a specific match.
    Returns null if no vote has been cast.
    """
    return service.get_my_vote(match_id, current_member.id)


@router.get("/me", response_model=List[Participation])
def read_my_participations(
    current_member: Member = Depends(get_current_active_member),
    service: ParticipationService = Depends(get_participation_service),
):
    """
    Get all participations for the current logged-in user.
    Uses the Service Layer to fetch data.
    """
    return service.list_member_participations(current_member.id)


@router.put("/admin/override", response_model=ParticipationRead)
def admin_override_participation(
    data: ParticipationAdminUpdate,
    service: ParticipationService = Depends(
        get_participation_service
    ),  # 👈 Service has repo injected
    current_member: Member = Depends(get_current_active_member),
):
    """
    Admin Override: Force update or create a vote for ANY member.
    """
    if "ADMIN" not in current_member.roles and "MANAGER" not in current_member.roles:
        raise HTTPException(status_code=403, detail="Not authorized")

    return service.admin_override_vote(data)
