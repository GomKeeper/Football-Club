# backend/app/api/match_templates.py
from typing import List
from fastapi import APIRouter, Depends
from app.models import MatchTemplate, MatchTemplateCreate
from app.services.match_template_service import MatchTemplateService
from app.core.dependencies import get_match_template_service

router = APIRouter()

@router.post("/", response_model=MatchTemplate)
def create_match_template(
    template_data: MatchTemplateCreate,
    service: MatchTemplateService = Depends(get_match_template_service)
):
    """
    Create a new Match Template.
    URL: POST /match-templates/
    """
    return service.create_template(template_data)

@router.get("/club/{club_id}", response_model=List[MatchTemplate])
def read_club_templates(
    club_id: int,
    service: MatchTemplateService = Depends(get_match_template_service)
):
    """
    Get all templates belonging to a specific Club.
    URL: GET /match-templates/club/{club_id}
    """
    templates = service.get_templates_for_club(club_id)

    return templates