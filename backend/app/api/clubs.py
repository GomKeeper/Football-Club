from fastapi import APIRouter, Depends
from typing import List
from app.models import Club
from app.schema import ClubUpdate
from app.services.club_service import ClubService
from app.core.dependencies import get_club_service

router = APIRouter()

@router.post("/", response_model=Club)
def create_club(club: Club, service: ClubService = Depends(get_club_service)):
    return service.create_club(club)

@router.get("/", response_model=List[Club])
def read_clubs(service: ClubService = Depends(get_club_service)):
    return service.list_clubs()

@router.get("/{club_id}", response_model=Club)
def read_club(club_id: int, service: ClubService = Depends(get_club_service)):
    """Get a specific club by ID"""
    return service.get_club(club_id)

@router.patch("/{club_id}", response_model=Club)
def update_club(club_id: int, update_data: ClubUpdate, service: ClubService = Depends(get_club_service)):
    return service.update_club(club_id, update_data)

@router.delete("/{club_id}")
def delete_club(club_id: int, service: ClubService = Depends(get_club_service)):
    service.remove_club(club_id)
    return {"ok": True}