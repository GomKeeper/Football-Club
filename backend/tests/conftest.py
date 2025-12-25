# backend/tests/conftest.py
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, delete
from jose import jwt

from app.main import app
from app.db import get_session
from app.models import Member, Club, MatchBase, Participation
from app.core.auth import SECRET_KEY, ALGORITHM

# 1. Setup In-Memory Database for Speed & Isolation
# Using sqlite with check_same_thread=False is standard for FastAPI tests
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
    Creates a fresh database session for each test.
    """
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    """
    Creates a TestClient that uses the in-memory database.
    """
    # Override the get_session dependency to use our test DB
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """
    Creates a dummy user with required fields (Kakao ID, Name).
    """
    user = Member(
        kakao_id="123456789",
        name="Test User",
        email="test@example.com",
        roles=["member"],
        status="ACTIVE"
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@pytest.fixture(name="normal_user_token_headers")
def normal_user_token_headers_fixture(test_user: Member):
    """
    Generates a valid JWT token for the test user and returns Authorization headers.
    """
    # Create the Token payload
    to_encode = {"sub": str(test_user.id)}
    
    # Sign it using the SAME secret key defined in app.core.auth
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Return standard Bearer header
    return {"Authorization": f"Bearer {encoded_jwt}"}