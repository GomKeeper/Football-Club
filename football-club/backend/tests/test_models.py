from sqlmodel import Session
from app.models import Member, MemberStatus, Club, Membership, MembershipStatus

def test_member_status_enum_values():
    """Ensure Enum values are strictly Uppercase (Prevent Regression)"""
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
    assert member.status == MemberStatus.PENDING # Should fail if default is wrong
    assert member.roles == ["viewer"]

def test_create_club_and_membership(session: Session):
    """Test relationship between Club, Member, and Membership"""
    # 1. Create Club
    club = Club(name="FC Test")
    session.add(club)
    session.commit()

    # 2. Create Member
    member = Member(kakao_id="999", name="Striker")
    session.add(member)
    session.commit()

    # 3. Create Membership
    membership = Membership(
        member_id=member.id,
        club_id=club.id,
        year=2025,
        status=MembershipStatus.ACTIVE
    )
    session.add(membership)
    session.commit()
    session.refresh(membership)

    assert membership.year == 2025
    assert membership.status == "ACTIVE" 
    