from datetime import datetime, timedelta, UTC
from jose import jwt
from app.core.config import settings
from app.models import Member, Role, MemberStatus
from app.repositories.member_repository import MemberRepository
from app.schemas import KakaoLoginRequest, Token
from app.core.utils import ensure_utc

class AuthService:
    def __init__(self, member_repository: MemberRepository):
        self.member_repository = member_repository

    def authenticate_kakao(self, login_data: KakaoLoginRequest) -> Token:
        """
        Orchestrates the login flow:
        1. Find Member or Create new one.
        2. Generate JWT Access Token.
        """
        # 1. Find or Create Member
        member = self.member_repository.get_by_kakao_id(login_data.kakao_id)
        
        if not member:
            # Register a new member
            member = Member(
                kakao_id=login_data.kakao_id,
                name=login_data.name,
                email=login_data.email,
                roles=[Role.VIEWER],
                status=MemberStatus.PENDING,
            )
            member = self.member_repository.create(member)

        # 2. Generate Token
        access_token = self._create_access_token(
            data={"sub": str(member.id)},
            expires_delta=timedelta(days=7) # 7 days expiry
        )

        return Token(access_token=access_token, token_type="bearer")

    def _create_access_token(self, data: dict, expires_delta: timedelta) -> str:
        """Internal helper to sign JWTs"""
        to_encode = data.copy()
        expire = datetime.now(UTC) + expires_delta
        to_encode.update({"exp": ensure_utc(expire)})
        
        return jwt.encode(
            to_encode, 
            settings.SECRET_KEY, 
            algorithm=settings.ALGORITHM
        )