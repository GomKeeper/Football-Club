from fastapi import HTTPException
from app.models import Member, MemberUpdate, MemberStatus
from app.repositories.member_repository import MemberRepository

class MemberService:
    def __init__(self, repository: MemberRepository):
        self.repository = repository

    def register_member(self, member_data: Member) -> Member:
        # Business Logic: Check for duplicates
        existing_member = self.repository.get_by_kakao_id(member_data.kakao_id)
        if existing_member:
            return existing_member
        member_data.status = MemberStatus.PENDING

        return self.repository.create(member_data)

    def get_member(self, member_id: int) -> Member:
        member = self.repository.get_by_id(member_id)
        if not member:
            raise HTTPException(status_code=404, detail="Member not found")
        return member

    def list_members(self) -> list[Member]:
        return self.repository.get_all()

    def update_member(self, member_id: int, update_data: MemberUpdate) -> Member:
        member = self.get_member(member_id) # Reuse 'get' logic to check existence
        
        # Apply updates
        data_dict = update_data.model_dump(exclude_unset=True)
        for key, value in data_dict.items():
            setattr(member, key, value)
            
        return self.repository.update(member)

    def remove_member(self, member_id: int):
        member = self.get_member(member_id)
        self.repository.delete(member)