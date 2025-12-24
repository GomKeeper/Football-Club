from typing import Optional, List
from datetime import datetime, date, time, timezone
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from sqlalchemy import Column, JSON

# --- Enums (Choices) ---
class Role(str, Enum):
    VIEWER = "VIEWER"
    EDITOR = "EDITOR"
    ADMIN = "ADMIN"
    ANNOUNCER = "ANNOUNCER"

class ParticipationStatus(str, Enum):
    JOIN = "JOIN"
    ABSENT = "ABSENT"
    TBD = "TBD"
    NONE = "NONE"

class NotificationType(str, Enum):
    INITIAL_POLLING = "INITIAL_POLLING"
    SOFT_DEADLINE = "SOFT_DEADLINE"
    HARD_DEADLINE = "HARD_DEADLINE"

class MemberStatus(str, Enum):
    PENDING = "PENDING"   # Waiting for approval
    ACTIVE = "ACTIVE"     # Approved Member
    REJECTED = "REJECTED" # Banned/Denied

class MembershipStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"

class MatchStatus(str, Enum):
    RECRUITING = "RECRUITING"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    FINISHED = "FINISHED"

# --- Tables ---

class Club(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    emblem_url: Optional[str] = None
    
    # Relationships
    members: List["Member"] = Relationship(back_populates="club")
    memberships: List["Membership"] = Relationship(back_populates="club")
    match_templates: List["MatchTemplate"] = Relationship(back_populates="club")    
    matches: List["Match"] = Relationship(back_populates="club")

class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: Optional[int] = Field(default=None, foreign_key="club.id")
    kakao_id: str = Field(index=True, unique=True) # Critical for Auth
    name: str
    status: MemberStatus = Field(default=MemberStatus.PENDING)
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Store roles as a JSON list (e.g. ["admin", "viewer"])
    roles: List[str] = Field(default=["viewer"], sa_column=Column(JSON))
    
    club: Optional[Club] = Relationship(back_populates="members")
    memberships: List["Membership"] = Relationship(back_populates="member")
    participations: List["Participant"] = Relationship(back_populates="member")

class Membership(SQLModel, table=True):
    """Annual membership status (e.g. 2025 Member)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    member_id: int = Field(foreign_key="member.id")
    club_id: int = Field(foreign_key="club.id")
    year: int = Field(index=True)
    status: MembershipStatus = Field(default=MembershipStatus.PENDING)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: Optional[datetime] = Field(default=None)

    member: Member = Relationship(back_populates="memberships")
    club: Club = Relationship(back_populates="memberships")

class MatchTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: int = Field(foreign_key="club.id")
    
    name: str = Field(index=True) # e.g., "Sunday Regular Match"
    description: Optional[str] = None
    
    # 🗓 Schedule Defaults (UTC)
    day_of_week: Optional[int] = None # 0=Monday, 6=Sunday (ISO format)
    start_time: time # Stored in UTC! (e.g., 11:00 for 20:00 KST)
    duration_minutes: int = Field(default=120) # 2 hours
    
    location: str
    min_participants: int = Field(default=10)
    max_participants: int = Field(default=22)
    
    # 🤖 Automation Settings (Deadlines relative to Match Start)
    # e.g., if match is Fri, polling_start_days_before=5 means poll starts Sun
    polling_start_hours_before: int = Field(default=144) # Default: 6 days (144h)
    soft_deadline_hours_before: int = Field(default=48) # 2 days before (48h)
    hard_deadline_hours_before: int = Field(default=24) # 1 day before (24h)

    # Relationships
    club: Optional[Club] = Relationship(back_populates="match_templates")

class Match(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: int = Field(foreign_key="club.id")
    
    # Snapshot Fields (Copied from Template)
    name: str 
    description: Optional[str] = None
    location: str
    
    # ⏰ The Concrete Schedule (UTC)
    start_time: datetime 
    end_time: datetime
    
    # 🤖 Calculated Deadlines (UTC)
    polling_start_at: datetime
    soft_deadline_at: datetime
    hard_deadline_at: datetime
    
    # Participants Limits
    min_participants: int
    max_participants: int
    
    status: MatchStatus = Field(default=MatchStatus.RECRUITING)
    
    # Relationships
    club: Optional["Club"] = Relationship(back_populates="matches")

class Participant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id")
    member_id: int = Field(foreign_key="member.id")
    
    status: ParticipationStatus = Field(default=ParticipationStatus.NONE)
    additional_message: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # match: Match = Relationship(back_populates="participants")
    member: Member = Relationship(back_populates="participations")

class NotificationLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id")
    sent_by_member_id: Optional[int] = Field(foreign_key="member.id")
    
    type: NotificationType
    scheduled_at: datetime
    sent_at: Optional[datetime] = None

# --- Create Schemas (For POST requests) ---
class MembershipCreate(SQLModel):
    member_id: int
    club_id: int
    year: int
    status: str = "active"
    started_at: datetime
    ended_at: Optional[datetime] = None

class MatchTemplateCreate(SQLModel):
    club_id: int
    name: str
    description: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: time 
    duration_minutes: int = 240
    location: str
    min_participants: int = 1
    max_participants: int = 100
    polling_start_hours_before: int = 144
    soft_deadline_hours_before: int = 48
    hard_deadline_hours_before: int = 24

class MatchCreateFromTemplate(SQLModel):
    template_id: int
    match_date: date # e.g., "2025-02-11"

class MatchCreateManual(SQLModel):
    club_id: int
    name: str
    description: Optional[str] = None
    location: str
    
    # ⏰ Concrete Schedule (UTC)
    start_time: datetime
    duration_minutes: int = 120 # Default 2 hours
    
    # 🤖 Deadlines (Can be optional, we can set defaults if missing)
    polling_start_at: Optional[datetime] = None
    soft_deadline_at: Optional[datetime] = None
    hard_deadline_at: Optional[datetime] = None
    
    min_participants: int = 10
    max_participants: int = 22

# --- Update Schemas (For PATCH requests) ---

class ClubUpdate(SQLModel):
    name: Optional[str] = None
    emblem_url: Optional[str] = None

class MemberUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    roles: Optional[List[str]] = None
    club_id: Optional[int] = None
    status: Optional[MemberStatus] = None

class MembershipUpdate(SQLModel):
    status: Optional[MembershipStatus] = None
    year: Optional[int] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class MatchTemplateUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    polling_start_hours_before: Optional[int] = None
    soft_deadline_hours_before: Optional[int] = None
    hard_deadline_hours_before: Optional[int] = None