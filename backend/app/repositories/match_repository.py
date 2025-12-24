from typing import List
from datetime import datetime
from sqlmodel import Session, select
from app.models import Match

class MatchRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, match: Match) -> Match:
        self.session.add(match)
        self.session.commit()
        self.session.refresh(match)
        return match

    def get_upcoming_matches(self, club_id: int) -> List[Match]:
        statement = (
            select(Match)
            .where(Match.club_id == club_id)
            .where(Match.start_time >= datetime.utcnow()) # Only future matches
            .order_by(Match.start_time) # Soonest first
        )
        return self.session.exec(statement).all()