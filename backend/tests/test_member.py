from app.models import Role

def test_update_member_profile(session, test_user):
    """Test updating fields like phone, back_number."""
    test_user.phone = "010-1234-5678"
    test_user.back_number = 10
    test_user.positions = ["FW", "MF"]
    
    session.add(test_user)
    session.commit()
    session.refresh(test_user)
    
    assert test_user.phone == "010-1234-5678"
    assert test_user.back_number == 10
    assert "FW" in test_user.positions

def test_change_member_role(session, test_user):
    """Test promoting a viewer to a manager."""
    assert Role.VIEWER in test_user.roles
    
    # Promote
    test_user.roles = [Role.EDITOR, Role.VIEWER]
    session.add(test_user)
    session.commit()
    session.refresh(test_user)
    
    assert Role.EDITOR in test_user.roles