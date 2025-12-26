from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlmodel import Session
from app.db import get_session
from app.models import Member
from app.core.config import settings


# This tells FastAPI where to look for the token (the URL is just for documentation)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_member(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> Member:
    """
    Decodes the JWT token and fetches the current member from the DB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Decode Token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        member_id: str = payload.get("sub") # 'sub' usually holds the ID (as string)
        
        if member_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
        
    # 2. Fetch Member from DB
    member = session.get(Member, int(member_id))
    
    if member is None:
        raise credentials_exception
        
    return member

def get_current_active_member(
    current_member: Member = Depends(get_current_member)
) -> Member:
    """
    Ensures the user is not only authenticated but also 'active' (not banned/deleted).
    """
    # If you have an 'is_active' field, check it here.
    # if not current_member.is_active:
    #     raise HTTPException(status_code=400, detail="Inactive user")
    return current_member