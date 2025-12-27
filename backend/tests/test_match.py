import pytest
from datetime import datetime
from app.schemas import MatchCreateManual
from app.services.match_service import MatchService
from app.repositories.match_repository import MatchRepository
from app.repositories.season_repository import SeasonRepository
from app.repositories.match_template_repository import MatchTemplateRepository
from fastapi import HTTPException

def test_create_match_manual_season_auto_detect(session, test_club, current_season):
    """Test that manual creation finds the correct season automatically."""
    match_repo = MatchRepository(session)
    template_repo = MatchTemplateRepository(session)
    season_repo = SeasonRepository(session)
    service = MatchService(match_repo, template_repo, season_repo)

    req = MatchCreateManual(
        club_id=test_club.id,
        name="Manual Match",
        location="Seoul",
        start_time=datetime(2025, 8, 15, 10, 0), # Inside Season
        duration_minutes=120
    )

    match = service.create_manual_match(req)
    assert match.season_id == current_season.id

def test_create_match_fail_no_season(session, test_club, current_season):
    """Test that creation fails if date is outside any known season."""
    match_repo = MatchRepository(session)
    template_repo = MatchTemplateRepository(session)
    season_repo = SeasonRepository(session)
    service = MatchService(match_repo, template_repo, season_repo)

    # Date in 2026 (No season exists in fixture)
    req = MatchCreateManual(
        club_id=test_club.id,
        name="Future Match",
        location="Seoul",
        start_time=datetime(2026, 1, 1, 10, 0), 
        duration_minutes=120
    )

    with pytest.raises(HTTPException) as exc:
        service.create_manual_match(req)
    
    assert "No season exists" in str(exc.value.detail)