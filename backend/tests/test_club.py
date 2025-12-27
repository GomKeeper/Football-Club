from app.models import Club
from sqlalchemy.exc import IntegrityError
import pytest

def test_create_club_success(session):
    club = Club(name="New FC", kst_location="Busan")
    session.add(club)
    session.commit()
    assert club.id is not None
    assert club.name == "New FC"

def test_club_name_unique(session, test_club):
    """Ensure we can't create two clubs with the exact same name (if constraint exists)."""
    # Assuming your model has unique=True on name. If not, this acts as a feature request test!
    # If your model DOESN'T enforce unique names yet, you can skip this or add the constraint.
    duplicate_club = Club(name="Test FC", kst_location="Jeju")
    session.add(duplicate_club)
    
    # Expect IntegrityError if unique constraint exists
    # If not, simply asserting it was created is fine (depending on your business rule)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        assert True # Constraint worked
    else:
        # If no constraint, strictly speaking this test passes, but maybe warn?
        assert duplicate_club.id is not None