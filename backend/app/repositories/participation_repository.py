from typing import Optional
from sqlmodel import Session, select
from app.models import Participation


class ParticipationRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_participation(
        self, match_id: int, member_id: int
    ) -> Optional[Participation]:
        statement = select(Participation).where(
            Participation.match_id == match_id, Participation.member_id == member_id
        )
        return self.session.exec(statement).first()

    def upsert_participation(self, participation: Participation) -> Participation:
        self.session.add(participation)
        self.session.commit()
        self.session.refresh(participation)
        return participation
