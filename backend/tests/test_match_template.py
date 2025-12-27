from datetime import datetime, timedelta
from app.repositories.match_repository import MatchRepository
from app.repositories.season_repository import SeasonRepository
from app.repositories.match_template_repository import MatchTemplateRepository
from app.services.match_service import MatchService
from app.schemas import MatchCreateFromTemplate

def test_create_match_from_template(session, test_club, current_season, test_match_template):
    """
    Integration: Create a Match using a Template + Auto-Season Detection.
    """
    # Setup Service
    match_repo = MatchRepository(session)
    season_repo = SeasonRepository(session)
    template_repo = MatchTemplateRepository(session)
    
    # Note: We pass None for other repos not needed for this specific test
    service = MatchService(match_repo, template_repo, season_repo)

    # 1. Define Request (Date INSIDE current_season)
    match_date = datetime(2025, 5, 20, 19, 0) # May 20, 2025
    
    req = MatchCreateFromTemplate(
        template_id=test_match_template.id,
        match_date=match_date.date(),
        start_time=match_date.time(),
        season_id=None # Test AUTO-DETECT logic
    )
    
    # 2. Execute
    match = service.create_match_from_template(req)
    
    # 3. Verify
    assert match.id is not None
    assert match.name == test_match_template.name
    assert match.season_id == current_season.id
    assert match.start_time == match_date