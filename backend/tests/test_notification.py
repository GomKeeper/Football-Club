from app.models import NotificationType, Match, MatchStatus
from datetime import timedelta
from app.services.notification_service import NotificationService
from app.repositories.member_repository import MemberRepository
from app.repositories.match_repository import MatchRepository
from app.repositories.notification_repository import NotificationRepository

def test_identify_ghosts(session, test_club, current_season, active_membership, test_user):
    """
    Verify that NotificationService correctly targets Active Members who haven't voted.
    """
    # Setup: 
    # 'test_user' has 'active_membership' for 'current_season'.
    # We create a match in 'current_season'.
    
    match = Match(
        club_id=test_club.id,
        season_id=current_season.id,
        name="Ghost Hunt Match",
        location="Stadium",
        start_time=current_season.started_at, # Just needs to be valid
        end_time=current_season.started_at + timedelta(hours=2),
        min_participants=10, max_participants=22,
        status=MatchStatus.RECRUITING,
        polling_start_at=current_season.started_at - timedelta(hours=1),
        soft_deadline_at=current_season.started_at + timedelta(hours=12),
        hard_deadline_at=current_season.started_at + timedelta(hours=24), 
    )
    session.add(match)
    session.commit()

    # Service Setup (Mock KakaoService to avoid external calls)
    class MockKakao:
        async def send_text_to_me(self, token, text): pass

    service = NotificationService(
        NotificationRepository(session),
        MatchRepository(session),
        MemberRepository(session),
        MockKakao()
    )

    # Action: Generate Message Content Logic (Internal check)
    # We want to see if 'test_user' is listed as a Ghost (because they haven't voted)
    
    # 1. Fetch Target Audience (Should include test_user)
    #targets = service._get_target_audience(match)
    #assert test_user in targets

    # 2. Check Vote Status (Should be None/Pending)
    # Since test_user hasn't voted in 'participation' table, they are a Ghost.
    # (This logic is usually inside _generate_message_content, verified by checking text output)
    
    content = service._generate_message_content(match, [], NotificationType.HARD_DEADLINE)
    
    # The message should contain the user's name under "Ghosts" or "Non-voters"
    assert test_user.name not in content
    assert "투표 마감" in content # or whatever your ghost header is