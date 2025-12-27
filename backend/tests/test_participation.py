import pytest
from freezegun import freeze_time
from datetime import datetime, timedelta, timezone
from app.models import Match, MatchStatus, Member, Role

@pytest.fixture(name="setup_match")
def setup_match_fixture(session, active_membership, current_season, test_club):
    """
    Creates a match linked to the current season.
    Requesting 'active_membership' guarantees 'test_user' is ready to vote.
    """
    base_time = datetime(2025, 1, 10, 12, 0, 0, tzinfo=timezone.utc)
    
    match = Match(
        club_id=test_club.id,
        season_id=current_season.id,
        name="Test Match",
        location="Stadium",
        start_time=base_time + timedelta(days=2),
        end_time=base_time + timedelta(days=2, hours=2),
        
        polling_start_at=base_time - timedelta(hours=1),
        hard_deadline_at=base_time + timedelta(hours=24),
        min_participants=10,
        max_participants=22,
        status=MatchStatus.RECRUITING,
    )
    session.add(match)
    session.commit()
    session.refresh(match)
    return match

# Note: 'normal_user_token_headers' authenticates 'test_user', who has 'active_membership'.

def test_vote_success(client, normal_user_token_headers, setup_match):
    match = setup_match
    with freeze_time("2025-01-10 12:00:00"):
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ATTENDING"},
        )
    assert response.status_code == 200
    assert response.json()["status"] == "ATTENDING"

def test_change_vote(client, normal_user_token_headers, setup_match):
    match = setup_match
    with freeze_time("2025-01-10 12:00:00"):
        client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ATTENDING"},
        )
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ABSENT"},
        )
    assert response.status_code == 200
    assert response.json()["status"] == "ABSENT"

def test_vote_too_early(client, normal_user_token_headers, setup_match):
    match = setup_match
    with freeze_time("2025-01-10 10:00:00"):
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ATTENDING"},
        )
    assert response.status_code == 400
    assert "Voting has not started yet" in response.json()["detail"]

def test_vote_too_late(client, normal_user_token_headers, setup_match):
    match = setup_match
    with freeze_time("2025-01-12 12:00:00"):
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=normal_user_token_headers,
            json={"status": "ATTENDING"},
        )
    assert response.status_code == 400
    assert "Voting is closed" in response.json()["detail"]

def test_vote_no_membership(client, session, setup_match):
    """
    Scenario: A user WITHOUT a membership tries to vote.
    'setup_match' ensures 'test_user' HAS a membership.
    So we must create a NEW 'ghost' user here.
    """
    from jose import jwt
    from app.core.config import settings

    # 1. Create Ghost User
    ghost = Member(kakao_id="ghost", name="Ghost", email="ghost@test.com", roles=[Role.VIEWER])
    session.add(ghost)
    session.commit()
    
    # 2. Token
    token = jwt.encode({"sub": str(ghost.id)}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    headers = {"Authorization": f"Bearer {token}"}

    match = setup_match

    # 3. Try to Vote
    with freeze_time("2025-01-10 12:00:00"):
        response = client.post(
            f"/participations/matches/{match.id}/vote",
            headers=headers,
            json={"status": "ATTENDING"},
        )

    # 4. Expect Gatekeeper Rejection
    assert response.status_code == 403
    assert "시즌권" in response.json()["detail"]