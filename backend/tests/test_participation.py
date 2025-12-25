# backend/tests/test_participation.py
import pytest
from freezegun import freeze_time
from datetime import datetime, timedelta, timezone
from sqlmodel import Session
from app.models import MatchBase, Club, MatchStatus, ParticipationStatus


# Helper to create a setup
@pytest.fixture(name="setup_match")
def setup_match_fixture(session: Session):
    # 1. Create Club
    club = Club(name="Test FC", description="Test Club")
    session.add(club)
    session.commit()
    session.refresh(club)

    # 2. Create Match (Scheduled for "Tomorrow")
    # We set deadlines relative to a fixed point in time we will use in tests
    # Let's assume "Current Time" will be 2025-01-10 12:00:00
    base_time = datetime(2025, 1, 10, 12, 0, 0, tzinfo=timezone.utc)
    match = MatchBase(
        club_id=club.id,
        name="Test Match",
        location="Stadium",
        start_time=base_time + timedelta(days=2),  # Match is in 2 days
        end_time=base_time + timedelta(days=2, hours=2),
        # Windows:
        polling_start_at=base_time - timedelta(hours=1),  # Started 1 hour ago
        hard_deadline_at=base_time + timedelta(hours=24),  # Ends in 24 hours
        min_participants=10,
        max_participants=22,
        status=MatchStatus.RECRUITING,
    )
    session.add(match)
    session.commit()
    session.refresh(match)

    return match


# --- TESTS ---


def test_vote_success(client, session, normal_user_token_headers, setup_match):
    """
    Scenario: User votes within the valid window.
    """
    match = setup_match

    # Freeze time to be INSIDE the window (2025-01-10 12:00:00)
    # Window is: 11:00 (Start) ~ Tomorrow 12:00 (End)
    with freeze_time("2025-01-10 12:00:00+00:00"):
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ATTENDING"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ATTENDING"
    assert data["match_id"] == match.id


def test_change_vote(client, session, normal_user_token_headers, setup_match):
    """
    Scenario: User changes vote from ATTENDING to ABSENT.
    """
    match = setup_match

    with freeze_time("2025-01-10 12:00:00"):
        # 1. First Vote
        client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ATTENDING"},
        )

        # 2. Change Vote
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ABSENT"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ABSENT"
    # Verify ID is same (Update, not Insert) - logic depends on repo but usually IDs persist
    # If ID changes, that's also fine as long as count is 1.


def test_vote_too_early(client, session, normal_user_token_headers, setup_match):
    """
    Scenario: User tries to vote BEFORE polling starts.
    """
    match = setup_match

    # Freeze time to be BEFORE polling start (10:00 AM)
    # Polling starts at 11:00 AM
    with freeze_time("2025-01-10 10:00:00"):
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ATTENDING"},
        )

    assert response.status_code == 400
    assert "Voting has not started yet" in response.json()["detail"]


def test_vote_too_late(client, session, normal_user_token_headers, setup_match):
    """
    Scenario: User tries to vote AFTER hard deadline.
    """
    match = setup_match

    # Freeze time to be AFTER deadline (Jan 12th)
    # Deadline was Jan 11th 12:00
    with freeze_time("2025-01-12 12:00:00"):
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ATTENDING"},
        )

    assert response.status_code == 400
    assert "Voting is closed" in response.json()["detail"]
