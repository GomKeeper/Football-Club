from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select
from app.models import Season

class SeasonRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, season: Season) -> Season:
        self.session.add(season)
        self.session.commit()
        self.session.refresh(season)
        return season

    def get_by_id(self, season_id: int) -> Optional[Season]:
        return self.session.get(Season, season_id)

    def get_all(self, club_id: int) -> List[Season]:
        statement = select(Season).where(Season.club_id == club_id).order_by(Season.started_at.desc())
        return self.session.exec(statement).all()

    def get_active(self, club_id: int) -> Optional[Season]:
        """Returns the currently active season for the club."""
        statement = select(Season).where(
            Season.club_id == club_id,
            Season.is_active == True # type: ignore
        )
        return self.session.exec(statement).first()
    
    def get_by_date(self, target_date: datetime, club_id: int) -> Optional[Season]:
        """
        Finds the season that contains the given date.
        """
        # Note: We use the date part for comparison to avoid timezone edge cases
        statement = select(Season).where(
            Season.club_id == club_id,
            Season.started_at <= target_date,
            Season.ended_at >= target_date
        )
        return self.session.exec(statement).first()