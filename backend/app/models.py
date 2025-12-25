from typing import Optional, List
from datetime import datetime, time, timezone
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
import sqlalchemy as sa
from sqlalchemy import Column, JSON

# -----------------------------------------------------------------------------
# 🛠️ SHARED MIXIN (Adds Timestamps to everything)
# -----------------------------------------------------------------------------
class TimestampMixin(SQLModel):
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=sa.DateTime(timezone=True),
        nullable=False,
    )
    
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_type=sa.DateTime(timezone=True),
        nullable=False,
        sa_column_kwargs={
            "onupdate": sa.func.now(),
        }
    )

# --- Enums ---
class Role(str, Enum):
    VIEWER = "VIEWER"
    EDITOR = "EDITOR"
    ADMIN = "ADMIN"
    ANNOUNCER = "ANNOUNCER"

class ParticipationStatus(str, Enum):
    ATTENDING = "ATTENDING"
    ABSENT = "ABSENT"
    PENDING = "PENDING"

class NotificationType(str, Enum):
    INITIAL_POLLING = "INITIAL_POLLING"
    SOFT_DEADLINE = "SOFT_DEADLINE"
    HARD_DEADLINE = "HARD_DEADLINE"

class MemberStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"

class MembershipStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"

class MatchStatus(str, Enum):
    RECRUITING = "RECRUITING"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    FINISHED = "FINISHED"

# -----------------------------------------------------------------------------
# 🏢 CLUB
# -----------------------------------------------------------------------------
class ClubBase(SQLModel):
    name: str
    emblem_url: Optional[str] = None

class Club(ClubBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships
    members: List["Member"] = Relationship(back_populates="club")
    memberships: List["Membership"] = Relationship(back_populates="club")
    match_templates: List["MatchTemplate"] = Relationship(back_populates="club")
    matches: List["Match"] = Relationship(back_populates="club")

# -----------------------------------------------------------------------------
# 👤 MEMBER
# -----------------------------------------------------------------------------
class MemberBase(SQLModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: MemberStatus = Field(default=MemberStatus.PENDING)
    # Roles as JSON
    roles: List[str] = Field(default=["VIEWER"], sa_column=Column(JSON))

class Member(MemberBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    kakao_id: str = Field(index=True, unique=True) # Auth ID (Internal)
    club_id: Optional[int] = Field(default=None, foreign_key="club.id")

    # Relationships
    club: Optional[Club] = Relationship(back_populates="members")
    memberships: List["Membership"] = Relationship(back_populates="member")
    participations: List["Participation"] = Relationship(back_populates="member")

# -----------------------------------------------------------------------------
# 🎫 MEMBERSHIP
# -----------------------------------------------------------------------------
class MembershipBase(SQLModel):
    year: int = Field(index=True)
    status: MembershipStatus = Field(default=MembershipStatus.PENDING)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: Optional[datetime] = Field(default=None)

class Membership(MembershipBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    member_id: int = Field(foreign_key="member.id")
    club_id: int = Field(foreign_key="club.id")

    # Relationships
    member: Member = Relationship(back_populates="memberships")
    club: Club = Relationship(back_populates="memberships")

# -----------------------------------------------------------------------------
# 📋 MATCH TEMPLATE
# -----------------------------------------------------------------------------
class MatchTemplateBase(SQLModel):
    name: str = Field(index=True)
    description: Optional[str] = None
    day_of_week: Optional[int] = None
    start_time: time
    duration_minutes: int = Field(default=120)
    location: str
    min_participants: int = Field(default=10)
    max_participants: int = Field(default=22)
    
    # Automation Settings
    polling_start_hours_before: int = Field(default=144)
    soft_deadline_hours_before: int = Field(default=48)
    hard_deadline_hours_before: int = Field(default=24)

class MatchTemplate(MatchTemplateBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: int = Field(foreign_key="club.id")

    # Relationships
    club: Optional[Club] = Relationship(back_populates="match_templates")

# -----------------------------------------------------------------------------
# ⚽ MATCH
# -----------------------------------------------------------------------------
class MatchBase(SQLModel):
    name: str
    description: Optional[str] = None
    location: str
    
    start_time: datetime
    end_time: datetime
    
    polling_start_at: datetime
    soft_deadline_at: Optional[datetime] = Field(default=None)
    hard_deadline_at: datetime
    
    min_participants: int
    max_participants: int
    
    status: MatchStatus = Field(default=MatchStatus.RECRUITING)

class Match(MatchBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: int = Field(foreign_key="club.id")
    
    # Relationships
    club: Optional["Club"] = Relationship(back_populates="matches")
    participations: List["Participation"] = Relationship(back_populates="match")

# -----------------------------------------------------------------------------
# 🙋 PARTICIPATION
# -----------------------------------------------------------------------------
class ParticipationBase(SQLModel):
    status: ParticipationStatus
    comment: Optional[str] = None

class Participation(ParticipationBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id", index=True)
    member_id: int = Field(foreign_key="member.id", index=True)

    # Relationships
    member: "Member" = Relationship(back_populates="participations")
    match: "Match" = Relationship(back_populates="participations")

# -----------------------------------------------------------------------------
# 🔔 NOTIFICATION LOG
# -----------------------------------------------------------------------------
class NotificationLog(TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="match.id")
    sent_by_member_id: Optional[int] = Field(foreign_key="member.id")
    type: NotificationType
    scheduled_at: datetime
    sent_at: Optional[datetime] = None