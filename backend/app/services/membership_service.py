from fastapi import HTTPException
from typing import List
from app.models import Membership, MembershipType
from datetime import datetime, timedelta, UTC
from app.schemas import MembershipUpdate
from app.repositories.membership_repository import MembershipRepository
from app.repositories.season_repository import SeasonRepository

class MembershipService:
    def __init__(self, repository: MembershipRepository, season_repository: SeasonRepository):
        self.repository = repository
        self.season_repository = season_repository

    def create_membership(self, member_id: int, season_id: int, type: MembershipType, club_id: int) -> Membership:
        season = self.season_repository.get_by_id(season_id)
        if not season:
            raise ValueError("Invalid Season")

        # 🧠 Smart Expiration Logic
        if type == MembershipType.REGULAR:
            # Regular members expire when the season ends
            expires_at = season.ended_at
        elif type == MembershipType.ON_TRIAL:
            # Trials expire in 30 days (example default)
            expires_at = datetime.now(UTC) + timedelta(days=30)
            # But cap it at season end
            if expires_at > season.ended_at:
                expires_at = season.ended_at
        else: # GUEST
            # Guests might expire in 7 days
            expires_at = datetime.now(UTC) + timedelta(days=7)

        membership = Membership(
            member_id=member_id,
            club_id=club_id,
            season_id=season_id,
            type=type,
            status="PENDING",
            expires_at=expires_at
        )
        return self.repository.create(membership)

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