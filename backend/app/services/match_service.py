from datetime import datetime, timedelta
from fastapi import HTTPException
from typing import List

from app.models import Match, MatchStatus
from app.schema import MatchCreateFromTemplate, MatchCreateManual, MatchUpdate
from app.repositories.match_template_repository import MatchTemplateRepository
from app.repositories.match_repository import MatchRepository


class MatchService:
    def __init__(
        self,
        match_repository: MatchRepository,
        template_repository: MatchTemplateRepository,
    ):
        self.match_repository = match_repository
        self.template_repository = template_repository

    def create_match_from_template(self, data: MatchCreateFromTemplate) -> Match:
        # 1. Fetch the Blueprint
        template = self.template_repository.get_by_id(data.template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

        # 2. Combine Date + Template Time to get Match Start (UTC)
        # Note: We assume the date provided matches the template's 'start_time' logic in UTC
        match_start_datetime = datetime.combine(data.match_date, template.start_time)

        # 3. Calculate End Time
        match_end_datetime = match_start_datetime + timedelta(
            minutes=template.duration_minutes
        )

        # 4. Calculate Deadlines (Subtracting hours)
        polling_start_dt = match_start_datetime - timedelta(
            hours=template.polling_start_hours_before
        )
        soft_deadline_dt = match_start_datetime - timedelta(
            hours=template.soft_deadline_hours_before
        )
        hard_deadline_dt = match_start_datetime - timedelta(
            hours=template.hard_deadline_hours_before
        )

        # 5. Create the Match Object
        new_match = Match(
            club_id=template.club_id,
            name=template.name,
            description=template.description,
            location=template.location,
            start_time=match_start_datetime,
            end_time=match_end_datetime,
            polling_start_at=polling_start_dt,
            soft_deadline_at=soft_deadline_dt,
            hard_deadline_at=hard_deadline_dt,
            min_participants=template.min_participants,
            max_participants=template.max_participants,
            status=MatchStatus.RECRUITING,
        )

        return self.match_repository.create(new_match)

    def create_manual_match(self, data: MatchCreateManual) -> Match:
        # 1. Calculate End Time
        end_time = data.start_time + timedelta(minutes=data.duration_minutes)

        # 2. Set Default Deadlines if missing (Safety Net)
        # Default: Poll starts 7 days before, Soft 2 days, Hard 1 day
        poll_start = data.polling_start_at or (data.start_time - timedelta(days=6))
        soft_dead = data.soft_deadline_at or (data.start_time - timedelta(days=2))
        hard_dead = data.hard_deadline_at or (data.start_time - timedelta(days=1))

        # 3. Create Match Object
        new_match = Match(
            club_id=data.club_id,
            name=data.name,
            description=data.description,
            location=data.location,
            start_time=data.start_time,
            end_time=end_time,
            polling_start_at=poll_start,
            soft_deadline_at=soft_dead,
            hard_deadline_at=hard_dead,
            min_participants=data.min_participants,
            max_participants=data.max_participants,
            status=MatchStatus.RECRUITING,
        )

        return self.match_repository.create(new_match)

    def get_upcoming_matches(self, club_id: int) -> List[Match]:
        return self.match_repository.get_upcoming_matches(club_id)

    def update_match(self, match_id: int, update_data: MatchUpdate) -> Match:
        match = self.match_repository.get_by_id(match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")

        # Apply updates only for provided fields
        match_data = update_data.model_dump(exclude_unset=True)
        for key, value in match_data.items():
            setattr(match, key, value)

        return self.match_repository.update(match)

    def delete_match(self, match_id: int):
        match = self.match_repository.get_by_id(match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        self.match_repository.delete(match)
