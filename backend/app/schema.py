from typing import List, Optional
from datetime import datetime, date
from sqlmodel import SQLModel
# Import Base Models and Enums
from app.models import (
    ClubBase, MemberBase, MatchTemplateBase, MatchBase, ParticipationBase,
    MemberStatus, MembershipStatus, MatchStatus, ParticipationStatus
)

# -----------------------------------------------------------------------------
# 🟢 CREATE SCHEMAS (Input)
# -----------------------------------------------------------------------------

class MembershipCreate(SQLModel):
    member_id: int
    club_id: int
    year: int
    status: str = "active"
    started_at: datetime
    ended_at: Optional[datetime] = None

class MatchTemplateCreate(MatchTemplateBase):
    club_id: int

class MatchCreateFromTemplate(SQLModel):
    template_id: int
    match_date: date

class MatchCreateManual(SQLModel):
    club_id: int
    name: str
    description: Optional[str] = None
    location: str
    start_time: datetime
    duration_minutes: int = 120
    
    # Optional overrides
    polling_start_at: Optional[datetime] = None
    soft_deadline_at: Optional[datetime] = None
    hard_deadline_at: Optional[datetime] = None
    
    min_participants: int = 10
    max_participants: int = 22

# -----------------------------------------------------------------------------
# 🟡 UPDATE SCHEMAS (Input - Partial)
# -----------------------------------------------------------------------------

class ClubUpdate(SQLModel):
    name: Optional[str] = None
    emblem_url: Optional[str] = None

class MemberUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    picture_url: Optional[str] = None
    
    phone: Optional[str] = None
    birth_year: Optional[int] = None
    back_number: Optional[int] = None
    positions: Optional[List[str]] = None

    # Admin Only (Handled in separate Admin Update if needed, or kept here)    
    roles: Optional[List[str]] = None
    status: Optional[MemberStatus] = None

class MatchUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[MatchStatus] = None
    
    polling_start_at: Optional[datetime] = None
    soft_deadline_at: Optional[datetime] = None
    hard_deadline_at: Optional[datetime] = None
    
    min_participants: Optional[int] = None
    max_participants: Optional[int] = None

class MembershipUpdate(SQLModel):
    status: Optional[MembershipStatus] = None
    year: Optional[int] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class ParticipationAdminUpdate(SQLModel):
    match_id: int
    member_id: int
    status: ParticipationStatus
    comment: Optional[str] = None

# -----------------------------------------------------------------------------
# 🔵 READ SCHEMAS (Output)
# -----------------------------------------------------------------------------

# 1. Helper: Member Summary (used in lists)
class MemberSummary(SQLModel):
    id: int
    name: str
    avatar_url: Optional[str] = None

# 2. Participation Read (Nested inside Match)
class ParticipationRead(ParticipationBase):
    id: int
    member_id: int
    member: Optional[MemberSummary] = None # 👈 Nested Member Data

# 3. Match Read (The big one)
class MatchRead(MatchBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    # List of participations
    participations: List[ParticipationRead] = []

# 4. Standard Reads
class ClubRead(ClubBase):
    id: int
    created_at: datetime
    updated_at: datetime

class MemberRead(MemberBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    # 🆕 Computed Properties
    age_group: str # We send the calculated group string ("1 그룹"), not raw birth year

class MemberMeRead(MemberRead):
    # Includes private info
    phone: Optional[str] = None
    birth_year: Optional[int] = None