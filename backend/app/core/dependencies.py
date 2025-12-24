from fastapi import Depends
from sqlmodel import Session
from app.db import get_session

# Repositories
from app.repositories.member_repository import MemberRepository
from app.repositories.club_repository import ClubRepository
from app.repositories.membership_repository import MembershipRepository
from app.repositories.match_template_repository import MatchTemplateRepository
from app.repositories.match_repository import MatchRepository

# Services
from app.services.member_service import MemberService
from app.services.club_service import ClubService
from app.services.membership_service import MembershipService
from app.services.match_template_service import MatchTemplateService
from app.services.match_service import MatchService

# --- Members ---
def get_member_repository(session: Session = Depends(get_session)) -> MemberRepository:
    return MemberRepository(session)

def get_member_service(repo: MemberRepository = Depends(get_member_repository)) -> MemberService:
    return MemberService(repo)

# --- Clubs ---
def get_club_repository(session: Session = Depends(get_session)) -> ClubRepository:
    return ClubRepository(session)

def get_club_service(repo: ClubRepository = Depends(get_club_repository)) -> ClubService:
    return ClubService(repo)

# --- Memberships ---
def get_membership_repository(session: Session = Depends(get_session)) -> MembershipRepository:
    return MembershipRepository(session)

def get_membership_service(repo: MembershipRepository = Depends(get_membership_repository)) -> MembershipService:
    return MembershipService(repo)

# --- Match Templates ---
def get_match_template_repository(session: Session = Depends(get_session)) -> MatchTemplateRepository:
    return MatchTemplateRepository(session)

def get_match_template_service(
    repository: MatchTemplateRepository = Depends(get_match_template_repository)
) -> MatchTemplateService:
    return MatchTemplateService(repository)

# --- Matches ---
def get_match_repository(session: Session = Depends(get_session)) -> MatchRepository:
    return MatchRepository(session)

def get_match_service(
    repository: MatchRepository = Depends(get_match_repository),
    template_repository: MatchTemplateRepository = Depends(get_match_template_repository)
) -> MatchService:
    return MatchService(repository, template_repository)