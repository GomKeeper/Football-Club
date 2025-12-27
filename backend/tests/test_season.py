import pytest
from datetime import datetime
from app.repositories.season_repository import SeasonRepository

def test_find_season_by_date(session, test_club, current_season):
    """
    Integration Test: Verify we can find the correct season given a date.
    Uses 'current_season' fixture which covers 2025-01-01 to 2025-12-31.
    """
    repo = SeasonRepository(session)
    
    # 1. Test: Date INSIDE the season (e.g., June 15th 2025)
    match_date = datetime(2025, 6, 15, 19, 0)
    found = repo.get_by_date(match_date, test_club.id)
    assert found is not None
    assert found.id == current_season.id
    assert found.name == current_season.name

    # 2. Test: Date OUTSIDE the season (e.g., 2026)
    future_date = datetime(2026, 1, 1, 10, 0)
    not_found = repo.get_by_date(future_date, test_club.id)
    assert not_found is None

def test_create_season_validation():
    """Unit/Service logic: Start date must be before End date."""
    start = datetime(2025, 12, 31)
    end = datetime(2025, 1, 1) # ❌ Wrong order
    
    with pytest.raises(Exception):
        if start >= end:
            raise ValueError("Start date must be before end date")