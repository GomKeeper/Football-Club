from fastapi import APIRouter, Depends
from app.models import Match, MatchCreateFromTemplate
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