from sqlmodel import Session, select
from typing import List, Optional
from app.models import Club

class ClubRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, club: Club) -> Club:
        self.session.add(club)
        self.session.commit()
        self.session.refresh(club)
        return club

    def get_by_id(self, club_id: int) -> Optional[Club]:
        return self.session.get(Club, club_id)

    def get_all(self) -> List[Club]:
        return self.session.exec(select(Club)).all()

    def update(self, club: Club) -> Club:
        self.session.add(club)
        self.session.commit()
        self.session.refresh(club)
        return club

    def delete(self, club: Club):
        self.session.delete(club)
        self.session.commit()