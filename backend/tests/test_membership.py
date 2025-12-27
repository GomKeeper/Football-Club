import pytest
from datetime import datetime, timedelta
from app.models import Membership, MembershipType
from app.services.membership_service import MembershipService
from app.repositories.membership_repository import MembershipRepository
from app.repositories.season_repository import SeasonRepository

def test_membership_expiration_logic(session, test_club, test_user, current_season):
    """
    Verify that Service correctly calculates expires_at based on Type.
    """
    repo = MembershipRepository(session)
    season_repo = SeasonRepository(session)
    service = MembershipService(repo, season_repo)

    # 1. REGULAR: Should expire at Season End
    mem_reg = service.create_membership(
        member_id=test_user.id,
        season_id=current_season.id,
        type=MembershipType.REGULAR,
        club_id=test_club.id
    )
    assert mem_reg.expires_at == current_season.ended_at

    # 2. GUEST: Should expire in ~7 day (Standard guest logic)
    guest_expires_expected = datetime.utcnow() + timedelta(days=7)
    
    mem_guest = service.create_membership(
        member_id=test_user.id, 
        season_id=current_season.id,
        type=MembershipType.GUEST,
        club_id=test_club.id
    )
    
    diff = abs((mem_guest.expires_at - guest_expires_expected).total_seconds())
    assert diff < 300  # Should be within 5 minutes

def test_gatekeeper_has_active_membership(session, test_club, test_user, current_season):
    """
    Verify the repository method used by MatchService to validate players.
    """
    repository = MembershipRepository(session)

    # 1. Initially: No Membership 
    # (test_user is fresh from fixture, no 'active_membership' fixture used here)
    assert repository.has_active_membership(test_user.id, current_season.id) is False

    # 2. Add ACTIVE Membership
    mem = Membership(
        member_id=test_user.id,
        club_id=test_club.id,
        season_id=current_season.id,
        type=MembershipType.REGULAR,
        status="ACTIVE",
        expires_at=current_season.ended_at
    )
    session.add(mem)
    session.commit()

    # 3. Check: Should be True
    assert repository.has_active_membership(test_user.id, current_season.id) is True

    # 4. Modify: Make it PENDING
    mem.status = "PENDING"
    session.add(mem)
    session.commit()

    # 5. Check: Should be False
    assert repository.has_active_membership(test_user.id, current_season.id) is False