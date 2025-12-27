from typing import Optional
from sqlmodel import Session, select
from app.models import Participation
from typing import Sequence


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

    def get_by_member_id(self: Session, member_id: int) -> Sequence[Participation]:
        statement = select(Participation).where(Participation.member_id == member_id)
        return self.session.exec(statement).all()

    def get_all_by_match_id(self, match_id: int) -> Sequence[Participation]:
        statement = select(Participation).where(Participation.match_id == match_id)
        return self.session.exec(statement).all()

    def get_by_match_id_and_member_id(self, match_id: int, member_id: int) -> Optional[Participation]:
        statement = (
            select(Participation)
            .where(Participation.match_id == match_id)
            .where(Participation.member_id == member_id)
        )
        return self.session.exec(statement).first()

    def save(self, participation: Participation) -> Participation:
        self.session.add(participation)
        self.session.commit()
        self.session.refresh(participation)
        return participation