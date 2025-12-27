from sqlmodel import Session, select
from typing import List, Optional
from app.models import Membership, MembershipStatus

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

    def has_active_membership(self, member_id: int, season_id: int) -> bool:
        statement = select(Membership).where(
            Membership.member_id == member_id,
            Membership.season_id == season_id,
            Membership.status == MembershipStatus.ACTIVE
        )
        return self.session.exec(statement).first() is not None

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