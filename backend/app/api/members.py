from fastapi import APIRouter, Depends
from typing import List
from app.models import Member
from app.schema import MemberUpdate
from app.services.member_service import MemberService
from app.core.dependencies import get_member_service
from app.core.auth import get_current_active_member

router = APIRouter()

@router.get("/me", response_model=Member)
def read_users_me(current_member: Member = Depends(get_current_active_member)):
    """
    Get current logged-in member's full profile.
    """
    return current_member

@router.post("/", response_model=Member)
def create_member(
    member: Member, 
    service: MemberService = Depends(get_member_service)
):
    return service.register_member(member)

@router.get("/", response_model=List[Member])
def read_members(
    service: MemberService = Depends(get_member_service)
):
    return service.list_members()

@router.get("/{member_id}", response_model=Member)
def read_member(
    member_id: int, 
    service: MemberService = Depends(get_member_service)
):
    return service.get_member(member_id)

@router.patch("/{member_id}", response_model=Member)
def update_member(
    member_id: int, 
    member_update: MemberUpdate, 
    service: MemberService = Depends(get_member_service)
):
    return service.update_member(member_id, member_update)

@router.delete("/{member_id}")
def delete_member(
    member_id: int, 
    service: MemberService = Depends(get_member_service)
):
    service.remove_member(member_id)
    return {"ok": True}