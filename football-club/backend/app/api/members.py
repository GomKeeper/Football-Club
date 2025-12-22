from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.db import get_session
from app.models import Member

router = APIRouter()

@router.post("/", response_model=Member)
def create_member(member: Member, session: Session = Depends(get_session)):
    """
    Register a new member. 
    In the future, this will be called automatically after Kakao Login.
    """
    # 1. Check if kakao_id already exists
    existing_member = session.exec(select(Member).where(Member.kakao_id == member.kakao_id)).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="Member with this Kakao ID already exists")

    # 2. Save to DB
    session.add(member)
    session.commit()
    session.refresh(member)
    return member

@router.get("/", response_model=List[Member])
def read_members(session: Session = Depends(get_session)):
    """List all members in the database"""
    members = session.exec(select(Member)).all()
    return members

@router.get("/{member_id}", response_model=Member)
def read_member(member_id: int, session: Session = Depends(get_session)):
    """Get a specific member by ID"""
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member