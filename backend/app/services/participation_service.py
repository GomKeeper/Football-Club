from datetime import datetime, timezone
from fastapi import HTTPException
from app.models import Participation, ParticipationStatus
from app.repositories.participation_repository import ParticipationRepository
from app.repositories.match_repository import MatchRepository

from typing import Optional, Sequence


class ParticipationService:
    def __init__(
        self,
        participation_repository: ParticipationRepository,
        match_repository: MatchRepository,
    ):
        self.participation_repository = participation_repository
        self.match_repository = match_repository

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