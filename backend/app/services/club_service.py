from fastapi import HTTPException
from typing import List
from app.models import Club
from app.schemas import ClubUpdate
from app.repositories.club_repository import ClubRepository

class ClubService:
    def __init__(self, repository: ClubRepository):
        self.repository = repository

    def create_club(self, club_data: Club) -> Club:
        return self.repository.create(club_data)

    def get_club(self, club_id: int) -> Club:
        club = self.repository.get_by_id(club_id)
        if not club:
            raise HTTPException(status_code=404, detail="Club not found")
        return club

    def list_clubs(self) -> List[Club]:
        return self.repository.get_all()

    def update_club(self, club_id: int, update_data: ClubUpdate) -> Club:
        club = self.get_club(club_id)
        
        data_dict = update_data.model_dump(exclude_unset=True)
        for key, value in data_dict.items():
            setattr(club, key, value)
            
        return self.repository.update(club)

    def remove_club(self, club_id: int):
        club = self.get_club(club_id)
        self.repository.delete(club)