from typing import List
from datetime import datetime, timezone
from sqlmodel import Session, select
from app.models import Match
from typing import Optional


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
            .where(Match.start_time >= datetime.now(timezone.utc))  # Only future matches
            .order_by(Match.start_time)  # Soonest first
        )
        return self.session.exec(statement).all()

    def get_by_id(self, match_id: int) -> Optional[Match]:
        return self.session.get(Match, match_id)

    def update(self, match: Match) -> Match:
        self.session.add(match)
        self.session.commit()
        self.session.refresh(match)
        return match

    def delete(self, match: Match):
        self.session.delete(match)
        self.session.commit()
