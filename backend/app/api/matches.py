from fastapi import APIRouter, Depends
from app.models import Match, MatchCreateFromTemplate, MatchCreateManual
from app.services.match_service import MatchService
from app.core.dependencies import get_match_service
from typing import List

router = APIRouter()

@router.post("/generate", response_model=Match)
def generate_match(
    data: MatchCreateFromTemplate,
    service: MatchService = Depends(get_match_service)
):
    """
    Generate a Match instance from a Template + Date.
    """
    return service.create_match_from_template(data)

@router.get("/club/{club_id}", response_model=List[Match])
def read_upcoming_matches(
    club_id: int,
    service: MatchService = Depends(get_match_service)
):
    """
    Get all upcoming matches for a club.
    """
    return service.get_upcoming_matches(club_id)

@router.post("/", response_model=Match)
def create_manual_match(
    data: MatchCreateManual,
    service: MatchService = Depends(get_match_service)
):
    """
    Manually create a match without a template.
    Useful for one-off events or friendlies.
    """
    return service.create_manual_match(data)