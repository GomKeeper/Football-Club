# backend/app/api/auth.py
from datetime import timedelta, datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from jose import jwt
from pydantic import BaseModel

from app.db import get_session
from app.models import Member
from app.core.auth import SECRET_KEY, ALGORITHM

router = APIRouter()


class KakaoLoginRequest(BaseModel):
    kakao_id: str
    name: str
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/login/kakao", response_model=Token)
def login_kakao(login_data: KakaoLoginRequest, session: Session = Depends(get_session)):
    # 1. Check if user exists
    statement = select(Member).where(Member.kakao_id == login_data.kakao_id)
    member = session.exec(statement).first()

    # 2. If not, create them (SignUp)
    if not member:
        member = Member(
            kakao_id=login_data.kakao_id,
            name=login_data.name,
            email=login_data.email,
            roles=["member"],
            status="ACTIVE",
        )
        session.add(member)
        session.commit()
        session.refresh(member)

    # 3. Create App JWT Token
    access_token = create_access_token(
        data={"sub": str(member.id)},  # We store internal ID in the token
        expires_delta=timedelta(days=30),  # Long expiry for convenience
    )

    return {"access_token": access_token, "token_type": "bearer"}
