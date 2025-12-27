from sqlmodel import Session
from app.models import Member, MemberStatus, Membership, MembershipType

def test_member_status_enum_values():
    """Ensure Enum values are strictly Uppercase"""
    assert MemberStatus.PENDING.value == "PENDING"
    assert MemberStatus.ACTIVE.value == "ACTIVE"
    assert MemberStatus.REJECTED.value == "REJECTED"

def test_create_member_default_status(session: Session):
    """Ensure new members default to PENDING"""
    member = Member(
        kakao_id="12345",
        name="Test Player",
        email="test@example.com"
    )
    session.add(member)
    session.commit()
    session.refresh(member)

    assert member.id is not None
    assert member.status == MemberStatus.PENDING 
    assert member.roles == ["VIEWER"]

def test_create_club_and_membership(session: Session, test_club, test_user, current_season):
    """Test relationship between Club, Member, Season, and Membership using fixtures"""
    # 1. Use Fixtures: test_club, test_user, current_season are already created.

    # 2. Create Membership Manually to verify the link works
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

    # Assertions
    assert membership.season_id == current_season.id
    assert membership.member_id == test_user.id
    assert membership.type == MembershipType.REGULAR
    assert membership.status == "ACTIVE"
    assert membership.expires_at == current_season.ended_at