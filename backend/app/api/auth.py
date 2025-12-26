from fastapi import APIRouter, Depends
from app.core.dependencies import get_auth_service
from app.services.auth_service import AuthService
from app.schemas import KakaoLoginRequest, Token

router = APIRouter()

@router.post("/login/kakao", response_model=Token)
def login_kakao(
    login_data: KakaoLoginRequest, 
    service: AuthService = Depends(get_auth_service)
):
    """
    Exchanges Kakao user data for an App JWT.
    If the user doesn't exist, they are auto-registered as PENDING.
    """
    return service.authenticate_kakao(login_data)