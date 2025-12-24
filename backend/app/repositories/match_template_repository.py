from typing import List, Optional
from sqlmodel import Session, select
from app.models import MatchTemplate

class MatchTemplateRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, template: MatchTemplate) -> MatchTemplate:
        self.session.add(template)
        self.session.commit()
        self.session.refresh(template)
        return template

    def get_by_id(self, template_id: int) -> Optional[MatchTemplate]:
        return self.session.get(MatchTemplate, template_id)

    def get_by_club(self, club_id: int) -> List[MatchTemplate]:
        statement = select(MatchTemplate).where(MatchTemplate.club_id == club_id)
        return self.session.exec(statement).all()