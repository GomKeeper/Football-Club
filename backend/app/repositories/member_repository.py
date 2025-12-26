from sqlmodel import Session, select
from typing import Optional, List
from app.models import Member

class MemberRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, member: Member) -> Member:
        self.session.add(member)
        self.session.commit()
        self.session.refresh(member)
        return member

    def get_by_id(self, member_id: int) -> Optional[Member]:
        return self.session.get(Member, member_id)

    def get_by_kakao_id(self, kakao_id: str) -> Optional[Member]:
        statement = select(Member).where(Member.kakao_id == kakao_id)
        return self.session.exec(statement).first()

    def get_all(self) -> List[Member]:
        return self.session.exec(select(Member)).all()

    def get_all_by_club_id(self, club_id: int) -> List[Member]:
        statement = select(Member).where(Member.club_id == club_id)
        return self.session.exec(statement).all()

    def update(self, member: Member) -> Member:
        self.session.add(member)
        self.session.commit()
        self.session.refresh(member)
        return member

    def delete(self, member: Member):
        self.session.delete(member)
        self.session.commit()