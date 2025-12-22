from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
from sqlalchemy import Column, JSON

# --- Enums (Choices) ---
class Role(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    ADMIN = "admin"
    ANNOUNCER = "announcer"

class ParticipationStatus(str, Enum):
    JOIN = "join"
    ABSENT = "absent"
    TBD = "tbd"
    NONE = "none"

class NotificationType(str, Enum):
    INITIAL_POLLING = "initial_polling"
    SOFT_DEADLINE = "soft_deadline"
    HARD_DEADLINE = "hard_deadline"

class MembershipStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"

# --- Tables ---

class Club(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    emblem_url: Optional[str] = None
    
    # Relationships
    members: List["Member"] = Relationship(back_populates="club")
    memberships: List["Membership"] = Relationship(back_populates="club")

class Member(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: Optional[int] = Field(default=None, foreign_key="club.id")
    kakao_id: str = Field(index=True, unique=True) # Critical for Auth
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Store roles as a JSON list (e.g. ["admin", "viewer"])
    roles: List[str] = Field(default=["viewer"], sa_column=Column(JSON))
    
    club: Optional[Club] = Relationship(back_populates="members")
    memberships: List["Membership"] = Relationship(back_populates="member")
    participations: List["Participant"] = Relationship(back_populates="member")
    managed_matches: List["Match"] = Relationship(back_populates="manager")

class Membership(SQLModel, table=True):
    """Annual membership status (e.g. 2025 Member)"""
    id: Optional[int] = Field(default=None, primary_key=True)
    member_id: int = Field(foreign_key="member.id")
    club_id: int = Field(foreign_key="club.id")
    year: int = Field(index=True)
    status: MembershipStatus = Field(default=MembershipStatus.PENDING)
    
    member: Member = Relationship(back_populates="memberships")
    club: Club = Relationship(back_populates="memberships")

class MatchTemplate(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    location: str
    duration_minutes: int = 90
    
    recurrence_cron: str # e.g. "0 10 * * 1"
    polling_lead_days: int = 7
    soft_deadline_lead_days: int = 3
    hard_deadline_lead_days: int = 1

class Match(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    template_id: Optional[int] = Field(default=None, foreign_key="matchtemplate.id")
    manager_id: Optional[int] = Field(default=None, foreign_key="member.id")
    
    title: str
    location: str
    starts_at: datetime
    ends_at: datetime
    
    # Notification Schedule
    start_polling_at: datetime
    soft_deadline: datetime
    hard_deadline: datetime
    
    participants: List["Participant"] = Relationship(back_populates="match")
    manager: Optional[Member] = Relationship(back_populates="managed_matches")

class Participant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id")
    member_id: int = Field(foreign_key="member.id")
    
    status: ParticipationStatus = Field(default=ParticipationStatus.NONE)
    additional_message: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    match: Match = Relationship(back_populates="participants")
    member: Member = Relationship(back_populates="participations")

class NotificationLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id")
    sent_by_member_id: Optional[int] = Field(foreign_key="member.id")
    
    type: NotificationType
    scheduled_at: datetime
    sent_at: Optional[datetime] = None

# --- Update Schemas (For PATCH requests) ---

class ClubUpdate(SQLModel):
    name: Optional[str] = None
    emblem_url: Optional[str] = None

class MemberUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    roles: Optional[List[str]] = None
    club_id: Optional[int] = None

class MembershipUpdate(SQLModel):
    status: Optional[MembershipStatus] = None
    year: Optional[int] = None