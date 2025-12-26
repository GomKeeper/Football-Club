from fastapi import APIRouter, Depends
from typing import List
from app.models import Membership
from app.schemas import MembershipUpdate
from app.services.membership_service import MembershipService
from app.core.dependencies import get_membership_service

router = APIRouter()

@router.post("/", response_model=Membership)
def create_membership(membership: Membership, service: MembershipService = Depends(get_membership_service)):
    return service.create_membership(membership)

@router.get("/", response_model=List[Membership])
def read_memberships(service: MembershipService = Depends(get_membership_service)):
    return service.list_memberships()

@router.get("/{membership_id}", response_model=Membership)
def read_membership(membership_id: int, service: MembershipService = Depends(get_membership_service)):
    return service.get_membership(membership_id)

@router.patch("/{membership_id}", response_model=Membership)
def update_membership(membership_id: int, update_data: MembershipUpdate, service: MembershipService = Depends(get_membership_service)):
    return service.update_membership(membership_id, update_data)

@router.delete("/{membership_id}")
def delete_membership(membership_id: int, service: MembershipService = Depends(get_membership_service)):
    service.remove_membership(membership_id)
    return {"ok": True}