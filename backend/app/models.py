from typing import Optional, List
from datetime import datetime, time, timezone, UTC
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum
import sqlalchemy as sa
from sqlalchemy import Column, JSON, Text
from pydantic import computed_field

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

# -----------------------------------------------------------------------------
# 🆕 ENUMS & CONSTANTS
# -----------------------------------------------------------------------------
class Role(str, Enum):
    VIEWER = "VIEWER"
    EDITOR = "EDITOR"
    ADMIN = "ADMIN"
    ANNOUNCER = "ANNOUNCER"

class ParticipationStatus(str, Enum):
    ATTENDING = "ATTENDING"
    ABSENT = "ABSENT"
    PENDING = "PENDING"

class MemberStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"

class MembershipStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"

class MembershipType(str, Enum):
    REGULAR = "REGULAR"   # Standard Season Member (Expires at Season End)
    ON_TRIAL = "ON_TRIAL" # Short-term (e.g., 1 month)
    GUEST = "GUEST"       # Very short-term (e.g., 1 day or 1 week)

class MatchStatus(str, Enum):
    RECRUITING = "RECRUITING"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"
    FINISHED = "FINISHED"

class PlayerPosition(str, Enum):
    # Forward
    ST = "ST"   # Striker
    SS = "SS"   # Second Striker
    FS = "FS"   # False Striker
    RW = "RW"   # Right Wing
    LW = "LW"   # Left Wing
    # Midfield
    CAM = "CAM" # Attacking Midfielder
    CM = "CM"   # Central Midfielder
    CDM = "CDM" # Defensive Midfielder
    RM = "RM"   # Right Midfielder
    LM = "LM"   # Left Midfielder
    # Defense
    CB = "CB"   # Center Back
    RB = "RB"   # Right Back
    LB = "LB"   # Left Back
    LWB = "LWB" # Left Wing Back
    RWB = "RWB" # Right Wing Back
    # Goalkeeper
    GK = "GK"

class NotificationType(str, Enum):
    POLLING_START = "POLLING_START" # 🆕 "Voting is OPEN!"
    SOFT_DEADLINE = "SOFT_DEADLINE" # "Please vote!"
    HARD_DEADLINE = "HARD_DEADLINE" # "Finalizing now."
    MANUAL = "MANUAL"               # Custom alerts

class NotificationStatus(str, Enum):
    PENDING = "PENDING"             # Generated, waiting for Manager to see
    SENT_TO_ADMIN = "SENT_TO_ADMIN" # Pushed to Manager's Kakao
    PUBLISHED = "PUBLISHED"         # Manager confirmed & sent to Group Chat


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
    seasons: List["Season"] = Relationship(back_populates="club")
    memberships: List["Membership"] = Relationship(back_populates="club")
    match_templates: List["MatchTemplate"] = Relationship(back_populates="club")
    matches: List["Match"] = Relationship(back_populates="club")

# -----------------------------------------------------------------------------
# 👤 MEMBER
# -----------------------------------------------------------------------------
class MemberBase(SQLModel):
    name: str
    email: Optional[str] = None
    picture_url: Optional[str] = None
    status: MemberStatus = Field(default=MemberStatus.PENDING)
    # Roles as JSON
    
    back_number: Optional[int] = None
    birth_year: Optional[int] = None

    # Store positions as a JSON list (e.g. ["LB", "CB"])
    positions: List[str] = Field(default=[], sa_column=Column(JSON))
    
    #Roles
    roles: List[str] = Field(default=["VIEWER"], sa_column=Column(JSON))

class Member(MemberBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    kakao_id: str = Field(index=True, unique=True) # Auth ID (Internal)
    club_id: Optional[int] = Field(default=None, foreign_key="club.id")

    # 🔐 Encrypted Phone Number (Stored as random-looking string)
    encrypted_phone: Optional[str] = Field(default=None)

    # Relationships
    club: Optional[Club] = Relationship(back_populates="members")
    memberships: List["Membership"] = Relationship(back_populates="member")
    participations: List["Participation"] = Relationship(back_populates="member")

    # 1. Phone Getter/Setter (Handles Encryption Automatically)
    @computed_field
    @property
    def phone(self) -> Optional[str]:
        from app.core.security_fields import decrypt_text
        if self.encrypted_phone:
            return decrypt_text(self.encrypted_phone)
        return None

    @phone.setter
    def phone(self, value: str):
        from app.core.security_fields import encrypt_text
        if value:
            self.encrypted_phone = encrypt_text(value)
        else:
            self.encrypted_phone = None

    # 2. Age Group Calculator
    @computed_field
    @property
    def age_group(self) -> str:
        if not self.birth_year:
            return "미입력"
        
        age = datetime.now().year - self.birth_year
        
        if age < 50:
            return "1 그룹 (20대~40대)"
        else:
            return "2 그룹 (50대+)"

# -----------------------------------------------------------------------------
# 🍂 SEASON
# -----------------------------------------------------------------------------
class SeasonBase(SQLModel):
    name: str = Field(index=True)
    
    started_at: datetime 
    ended_at: datetime
    
    is_active: bool = Field(default=True)

class Season(SeasonBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    club_id: int = Field(foreign_key="club.id")
    
    # Relationships
    club: "Club" = Relationship(back_populates="seasons")
    matches: List["Match"] = Relationship(back_populates="season")
    memberships: List["Membership"] = Relationship(back_populates="season")

# -----------------------------------------------------------------------------
# 🎫 MEMBERSHIP
# -----------------------------------------------------------------------------
class MembershipBase(SQLModel):
    status: MembershipStatus = Field(default=MembershipStatus.PENDING)
    type: MembershipType = Field(default=MembershipType.REGULAR)
    
    joined_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    expires_at: Optional[datetime] = Field(default=None)

class Membership(MembershipBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    member_id: int = Field(foreign_key="member.id")
    club_id: int = Field(foreign_key="club.id")
    season_id: int = Field(foreign_key="season.id")

    # Relationships
    club: Club = Relationship(back_populates="memberships")
    member: Member = Relationship(back_populates="memberships")
    season: Season = Relationship(back_populates="memberships")
    
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
    max_participants: int = Field(default=50)
    
    # Automation Settings
    polling_start_hours_before: int = Field(default=144)
    soft_deadline_hours_before: int = Field(default=None)
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
    season_id: int = Field(foreign_key="season.id")

    # Relationships
    club: Optional["Club"] = Relationship(back_populates="matches")
    season: Season = Relationship(back_populates="matches")
    participations: List["Participation"] = Relationship(back_populates="match")
    notifications: List["Notification"] = Relationship(back_populates="match")

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
# 🔔 NOTIFICATION
# -----------------------------------------------------------------------------

class NotificationBase(SQLModel):
    type: NotificationType
    status: NotificationStatus = Field(default=NotificationStatus.PENDING)
    content: str = Field(sa_column=Column(Text)) # Snapshot of the message
    sent_at: Optional[datetime] = None 
    
    match_id: int = Field(foreign_key="match.id")

class Notification(NotificationBase, TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # Relationships
    match: "Match" = Relationship(back_populates="notifications")