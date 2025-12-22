from sqlmodel import Session, select
from typing import List, Optional
from app.models import Membership

class MembershipRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, membership: Membership) -> Membership:
        self.session.add(membership)
        self.session.commit()
        self.session.refresh(membership)
        return membership

    def get_by_id(self, membership_id: int) -> Optional[Membership]:
        return self.session.get(Membership, membership_id)

    def get_by_year_and_member(self, member_id: int, club_id: int, year: int) -> Optional[Membership]:
        """Custom query to find existing membership for a specific year"""
        statement = select(Membership).where(
            Membership.member_id == member_id,
            Membership.club_id == club_id,
            Membership.year == year
        )
        return self.session.exec(statement).first()

    def get_all(self) -> List[Membership]:
        return self.session.exec(select(Membership)).all()

    def update(self, membership: Membership) -> Membership:
        self.session.add(membership)
        self.session.commit()
        self.session.refresh(membership)
        return membership

    def delete(self, membership: Membership):
        self.session.delete(membership)
        self.session.commit()