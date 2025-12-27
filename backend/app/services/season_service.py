from fastapi import HTTPException
from app.models import Season
from app.repositories.season_repository import SeasonRepository
from app.schemas import SeasonCreate

class SeasonService:
    def __init__(self, season_repo: SeasonRepository):
        self.season_repo = season_repo

    def create_season(self, club_id: int, data: SeasonCreate) -> Season:
        if data.started_at >= data.ended_at:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        season = Season(
            club_id=club_id,
            **data.model_dump()
        )
        return self.season_repo.create(season)

    def get_active_season(self, club_id: int) -> Season:
        """
        Helper for other services: Get the active season or fail.
        """
        season = self.season_repo.get_active(club_id)
        if not season:
            raise HTTPException(status_code=404, detail="No active season found for this club.")
        return season

    def get_season_by_id(self, season_id: int) -> Season:
        season = self.season_repo.get_by_id(season_id)
        if not season:
            raise HTTPException(status_code=404, detail="Season not found")
        return season