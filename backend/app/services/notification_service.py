from typing import List, Tuple
from app.models import Notification, NotificationType, NotificationStatus, Match, Member
from app.repositories.notification_repository import NotificationRepository
from app.repositories.match_repository import MatchRepository
from app.repositories.member_repository import MemberRepository

class NotificationService:
    def __init__(
        self, 
        notification_repository: NotificationRepository,
        match_repository: MatchRepository,
        member_repository: MemberRepository
    ):
        self.notification_repository = notification_repository
        self.match_repository = match_repository
        self.member_repository = member_repository

    def _generate_message_content(self, match: Match, all_members: List[Member], n_type: NotificationType) -> str:
        """
        Internal Helper: Constructs the KakaoTalk message string.
        """
        # 1. Process Votes
        participations = {p.member_id: p.status for p in match.participations}
        attending = []
        absent = []
        ghosts = []

        for member in all_members:
            status = participations.get(member.id, "PENDING")
            if status == "ATTENDING":
                attending.append(member.name)
            elif status == "ABSENT":
                absent.append(member.name)
            else:
                ghosts.append(member.name)

        # 2. Format Components
        time_str = match.start_time.strftime('%m/%d(%a) %H:%M')
        link = "🔗 투표: https://fc-app.com"

        # 3. Build Text based on Type
        if n_type == NotificationType.POLLING_START:
            return (
                f"🗳️ [투표 시작] {match.name}\n\n"
                f"📅 {time_str}\n📍 {match.location}\n\n"
                f"참석 여부를 투표해주세요!\n{link}"
            )
        
        # Deadlines
        header = "⏳ 마감 임박" if n_type == NotificationType.SOFT_DEADLINE else "🛑 투표 마감"
        stats = f"✅{len(attending)} ❌{len(absent)} 👻{len(ghosts)}"
        attending_list = ", ".join(attending) if attending else "-"
        
        msg = (
            f"{header} - {match.name}\n"
            f"📅 {time_str}\n"
            f"{stats}\n\n"
            f"⚽ 참석자:\n{attending_list}"
        )

        if ghosts:
            msg += f"\n\n👇 미투표:\n{', '.join(ghosts)}\n\n🚨 투표해주세요!"
        
        msg += f"\n\n{link}"
        return msg

    def preview_notification(self, match_id: int, n_type: NotificationType) -> str:
        """
        Just returns the text without saving to DB.
        """
        match = self.match_repository.get_by_id(match_id)
        if not match:
            return "Error: Match not found"
        
        all_members = self.member_repository.get_all_by_club_id(match.club_id) 
        
        return self._generate_message_content(match, all_members, n_type)

    def create_notification(self, match_id: int, n_type: NotificationType) -> Notification:
        """
        Generates content and saves to DB.
        """
        match = self.match_repository.get_by_id(match_id)
        if not match:
            raise ValueError("Match not found")

        all_members = self.member_repository.get_all_by_club_id(match.club_id)
        content = self._generate_message_content(match, all_members, n_type)

        notification = Notification(
            match_id=match_id,
            type=n_type,
            content=content,
            status=NotificationStatus.PENDING
        )
        return self.notification_repository.create(notification)