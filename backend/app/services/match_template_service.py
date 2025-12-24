from typing import List
from app.models import MatchTemplate, MatchTemplateCreate
from app.repositories.match_template_repository import MatchTemplateRepository

class MatchTemplateService:
    def __init__(self, repository: MatchTemplateRepository):
        self.repository = repository

    def create_template(self, template_data: MatchTemplateCreate) -> MatchTemplate:
        template = MatchTemplate.model_validate(template_data)
        return self.repository.create(template)

    def get_templates_for_club(self, club_id: int) -> List[MatchTemplate]:
        return self.repository.get_by_club(club_id)