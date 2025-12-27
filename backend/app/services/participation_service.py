from datetime import datetime, timezone
from fastapi import HTTPException
from app.models import Participation, ParticipationStatus
from app.schemas import ParticipationAdminUpdate
from app.repositories.participation_repository import ParticipationRepository
from app.repositories.match_repository import MatchRepository
from app.repositories.membership_repository import MembershipRepository

from typing import Optional, Sequence


class ParticipationService:
    def __init__(
        self,
        participation_repository: ParticipationRepository,
        match_repository: MatchRepository,
        membership_repository: MembershipRepository,
    ):
        self.participation_repository = participation_repository
        self.match_repository = match_repository
        self.membership_repository = membership_repository

    def vote(
        self,
        match_id: int,
        member_id: int,
        status: ParticipationStatus,
        comment: Optional[str] = None,
    ) -> Participation:
        # 1. Check if Match exists
        match = self.match_repository.get_by_id(match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        # --------------------------------------------------------- 
        # 🛡️ GATEKEEPER LOGIC (The Fix)
        # ---------------------------------------------------------
        
        # A. Allow Guests / Trials to bypass (if your rules allow it)
        # (Assuming you use Member.roles or Member.status for this distinction)
        is_guest_or_trial = False 
        # Example check (adjust based on your exact Role/Status enums):
        # if member.status == MemberStatus.TRIAL: is_guest_or_trial = True
        
        if not is_guest_or_trial:
            # B. Strict Check for Regular Members
            has_membership = self.membership_repository.has_active_membership(
                member_id=member_id,
                season_id=match.season_id
            )

            if not has_membership:
                raise HTTPException(
                    status_code=403,
                    detail="❌ 유효한 시즌권 내역이 없습니다. 운영진에게 문의 부탁 드립니다"
                )

        # 2. Check Deadlines
        now = datetime.now(timezone.utc)

        def ensure_utc(dt: datetime) -> datetime:
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt

        # A. Has voting started?
        if match.polling_start_at:
            start_at = ensure_utc(match.polling_start_at)
            if now < start_at:
                raise HTTPException(
                    status_code=400, detail="Voting has not started yet"
                )

        # B. Has voting ended?
        if match.hard_deadline_at:
            deadline_at = ensure_utc(match.hard_deadline_at)
            if now > deadline_at:
                raise HTTPException(
                    status_code=400, detail="Voting is closed (Deadline passed)"
                )

        # C. Check "PENDING" restriction (Soft Deadline)
        if status == ParticipationStatus.PENDING:
            # If soft deadline exists and passed, forbid PENDING
            if match.soft_deadline_at:
                soft_deadline = ensure_utc(match.soft_deadline_at)
                if now > soft_deadline:
                    raise HTTPException(
                        status_code=400,
                        detail="Pending status is no longer allowed (Soft Deadline passed).",
                    )

        # 4. Upsert with Comment
        existing = self.participation_repository.get_participation(match_id, member_id)

        if existing:
            existing.status = status
            existing.comment = comment
            existing.updated_at = now
            return self.participation_repository.upsert_participation(existing)
        else:
            new_vote = Participation(
                match_id=match_id, member_id=member_id, status=status, comment=comment
            )
            return self.participation_repository.upsert_participation(new_vote)

    def get_my_vote(self, match_id: int, member_id: int) -> Participation | None:
        return self.participation_repository.get_participation(match_id, member_id)

    def list_member_participations(self, member_id: int) -> Sequence[Participation]:
        return self.participation_repository.get_by_member_id(member_id)

    def admin_override_vote(self, data: ParticipationAdminUpdate) -> Participation:
        # 1. Try to find existing vote using Repo
        participation = self.participation_repository.get_by_match_id_and_member_id(
            data.match_id, data.member_id
        )

        if participation:
            # 2. Update existing
            participation.status = data.status
            if data.comment is not None:
                participation.comment = data.comment
        else:
            # 3. Create new instance
            participation = Participation(
                match_id=data.match_id,
                member_id=data.member_id,
                status=data.status,
                comment=data.comment
            )

        # 4. Save using Repo (Handling session.add/commit/refresh internally)
        return self.participation_repository.save(participation)