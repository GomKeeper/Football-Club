from sqlmodel import Session
from app.models import Match

class MatchRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, match: Match) -> Match:
        self.session.add(match)
        self.session.commit()
        self.session.refresh(match)
        return match