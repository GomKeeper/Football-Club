from fastapi import HTTPException
from typing import List
from app.models import Membership, MembershipStatus
from app.schema import MembershipUpdate
from app.repositories.membership_repository import MembershipRepository

class MembershipService:
    def __init__(self, repository: MembershipRepository):
        self.repository = repository

    def create_membership(self, membership_data: Membership) -> Membership:
        # BUSINESS LOGIC: Enforce one membership per year per club
        existing = self.repository.get_by_year_and_member(
            member_id=membership_data.member_id,
            club_id=membership_data.club_id,
            year=membership_data.year
        )
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Member already has a membership for {membership_data.year}"
            )

        # Default to PENDING if not specified
        if not membership_data.status:
            membership_data.status = MembershipStatus.PENDING
            
        return self.repository.create(membership_data)

    def get_membership(self, membership_id: int) -> Membership:
        membership = self.repository.get_by_id(membership_id)
        if not membership:
            raise HTTPException(status_code=404, detail="Membership not found")
        return membership

    def list_memberships(self) -> List[Membership]:
        return self.repository.get_all()

    def update_membership(self, membership_id: int, update_data: MembershipUpdate) -> Membership:
        membership = self.get_membership(membership_id)
        
        data_dict = update_data.model_dump(exclude_unset=True)
        for key, value in data_dict.items():
            setattr(membership, key, value)
            
        return self.repository.update(membership)

    def remove_membership(self, membership_id: int):
        membership = self.get_membership(membership_id)
        self.repository.delete(membership)