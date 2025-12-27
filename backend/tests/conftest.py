import pytest
from datetime import datetime, timezone, time
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from jose import jwt

from app.main import app
from app.db import get_session
from app.models import Member, Club, MemberStatus, Role, Season, Membership, MembershipType, MatchTemplate
from app.core.config import settings

# -----------------------------------------------------------------------------
# 1. DATABASE SETUP
# -----------------------------------------------------------------------------
# Using sqlite in-memory for speed. check_same_thread=False is needed for FastAPI.
sqlite_file_name = "file::memory:?cache=shared"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(
    sqlite_url, 
    connect_args={"check_same_thread": False}, 
    poolclass=None
)

@pytest.fixture(name="session")
def session_fixture():
    """
    Creates a fresh, empty database session for EACH test function.
    """
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    """
    Creates a TestClient linked to the in-memory DB.
    """
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


# -----------------------------------------------------------------------------
# 2. BASE ENTITIES (Club, User)
# -----------------------------------------------------------------------------
@pytest.fixture(name="test_club")
def fixture_test_club(session: Session):
    club = Club(name="Test FC", kst_location="Seoul")
    session.add(club)
    session.commit()
    session.refresh(club)
    return club

@pytest.fixture(name="test_user")
def fixture_test_user(session: Session):
    """
    A Standard Active Member (but NO membership/season yet).
    Replaces the old 'test_member' to avoid confusion.
    """
    user = Member(
        kakao_id="123456789",
        name="Test User",
        email="test@example.com",
        roles=[Role.VIEWER],
        status=MemberStatus.ACTIVE
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


# -----------------------------------------------------------------------------
# 3. CONTEXT ENTITIES (Season)
# -----------------------------------------------------------------------------
@pytest.fixture(name="current_season")
def fixture_current_season(session: Session, test_club: Club):
    """
    Creates a standard '2025 Season' covering the whole year.
    Use this fixture when your test needs a valid season context.
    """
    season = Season(
        name="2025 Season",
        started_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        ended_at=datetime(2025, 12, 31, tzinfo=timezone.utc),
        is_active=True,
        club_id=test_club.id
    )
    session.add(season)
    session.commit()
    session.refresh(season)
    return season


# -----------------------------------------------------------------------------
# 4. PERMISSION ENTITIES (Membership)
# -----------------------------------------------------------------------------
@pytest.fixture(name="active_membership")
def fixture_active_membership(session: Session, test_user: Member, current_season: Season, test_club: Club):
    """
    The 'Golden Ticket'. 🎫
    Automatically grants the 'test_user' a valid REGULAR membership for 'current_season'.
    
    Request this fixture in tests where the user must pass the Gatekeeper (e.g. Voting).
    """
    membership = Membership(
        member_id=test_user.id,
        club_id=test_club.id,
        season_id=current_season.id,
        type=MembershipType.REGULAR,
        status="ACTIVE",
        expires_at=current_season.ended_at
    )
    session.add(membership)
    session.commit()
    session.refresh(membership)
    return membership


# -----------------------------------------------------------------------------
# 5. AUTHENTICATION
# -----------------------------------------------------------------------------
@pytest.fixture(name="normal_user_token_headers")
def fixture_normal_user_token_headers(test_user: Member):
    """
    Generates a valid Bearer token for 'test_user'.
    Does NOT imply the user has a membership (request 'active_membership' for that).
    """
    to_encode = {"sub": str(test_user.id)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return {"Authorization": f"Bearer {encoded_jwt}"}

# -----------------------------------------------------------------------------
# 6. TEMPLATES
# -----------------------------------------------------------------------------
@pytest.fixture(name="test_match_template")
def fixture_test_match_template(session: Session, test_club: Club):
    """
    Creates a standard Match Template (e.g., 'Friday Night Football').
    """
    template = MatchTemplate(
        name="Friday Night Football",
        description="Regular Friday Match",
        location="Han River Park",
        duration_minutes=120,
        min_participants=10,
        max_participants=22,
        club_id=test_club.id,
        start_time=time(19, 0),  # 19:00 (7 PM)
        day_of_week=4,           # Friday (0=Mon, 6=Sun)
        polling_start_hours_before=144,
        soft_deadline_hours_before=48,
        hard_deadline_hours_before=24,
    )
    session.add(template)
    session.commit()
    session.refresh(template)
    return template