from typing import List, Dict
from app.models import (
    Notification,
    NotificationType,
    NotificationStatus,
    Match,
    ParticipationStatus,
)
from app.schemas import NotificationTestRequest
from app.repositories.notification_repository import NotificationRepository
from app.repositories.match_repository import MatchRepository
from app.repositories.membership_repository import MembershipRepository
from app.repositories.participation_repository import ParticipationRepository
from app.services.kakao_service import KakaoService
from zoneinfo import ZoneInfo
from app.core.config import settings
from app.core.utils import KR_WEEKDAYS

class NotificationService:
    def __init__(
        self,
        notification_repository: NotificationRepository,
        match_repository: MatchRepository,
        membership_repository: MembershipRepository,
        participation_repository: ParticipationRepository,
        kakao_service: KakaoService = None,
    ):
        self.notification_repository = notification_repository
        self.match_repository = match_repository
        self.membership_repository = membership_repository
        self.participation_repository = participation_repository
        self.kakao_service = KakaoService()

    def preview_notification(self, match_id: int, n_type: NotificationType) -> str:
        """
        Just returns the text without saving to DB.
        """
        match = self.match_repository.get_by_id(match_id)
        if not match:
            return "Error: Match not found"

        return self._generate_message_content(match, n_type)

    def create_notification(
        self, match_id: int, n_type: NotificationType
    ) -> Notification:
        """
        Generates content and saves to DB.
        """
        match = self.match_repository.get_by_id(match_id)
        if not match:
            raise ValueError("Match not found")

        content = self._generate_message_content(match, n_type)

        notification = Notification(
            match_id=match_id,
            type=n_type,
            content=content,
            status=NotificationStatus.PENDING,
        )
        return self.notification_repository.create(notification)

    async def send_to_announcer(self, notification_id: int, admin_token: str):
        """
        1. Load the notification
        2. Send it to the admin via Kakao
        3. Update status to SENT_TO_ADMIN
        """
        # 1. Get Notification
        notification = self.notification_repository.get_by_id(notification_id)
        if not notification:
            raise ValueError("Notification not found")

        # 2. Send via Kakao
        await self.kakao_service.send_text_to_me(admin_token, notification.content)

        # 3. Update Log Status
        self.notification_repository.update_status(
            notification, NotificationStatus.SENT_TO_ADMIN
        )

        return {"status": "success", "message": "Sent to Announcer"}

    async def send_test_notification(self, req: NotificationTestRequest):
        """
        Generates the message on the fly and sends it to the admin (me).
        Does NOT save to the database.
        """
        # 1. Fetch Data
        match = self.match_repository.get_by_id(req.match_id)
        if not match:
            raise ValueError("Match not found")

        # 2. Generate Content (Reuse your existing logic)
        content = self._generate_message_content(match, req.type)

        # 3. Send via Kakao
        await self.kakao_service.send_text_to_me(req.kakao_access_token, content)

    def _generate_message_content(
        self, match: Match, n_type: NotificationType
    ) -> str:
        """
        Internal Helper: Constructs the KakaoTalk message string.
        """
        # 1. Process Votes
        stats = self._get_match_stats(match)

        attending_members_str = ", ".join(stats['ATTENDING'])
        pending_members_str = ", ".join(stats['PENDING'])
        absent_members_str = ", ".join(stats['ABSENT'])
        ghosts_members_str = ", ".join(stats['GHOST'])

        # 2. Format Components
        app_tz = ZoneInfo(settings.TIMEZONE)

        # Ensure we treat the DB time as UTC
        utc_time = match.start_time
        if utc_time.tzinfo is None:
            utc_time = utc_time.replace(tzinfo=ZoneInfo("UTC"))

        local_time = utc_time.astimezone(app_tz)
        
        day_str = KR_WEEKDAYS[local_time.weekday()]

        time_str = local_time.strftime(f"%m/%d({day_str}) %H:%M")

        link = "https://football-club-beta.vercel.app/"

        # Common Header
        base_msg = f"⚽ [{match.name}]\n"
        base_msg += f"📅 일시: {time_str}\n"
        base_msg += f"🏟 장소: {match.location}\n"
        base_msg += "------------------\n"        

        if n_type == NotificationType.POLLING_START:
            return (
                f"{base_msg}"
                f"🚀 출석 체크가 시작되었습니다!\n\n"
                f"이번 주 참석 여부를 표시해 주시길 부탁드립니다.\n"
                f"🔗 출첵하러 가기: {link}"
            )

        elif n_type == NotificationType.SOFT_DEADLINE:
            # Friendly Reminder
            return (
                f"{base_msg}"
                f"⏳ 참석 체크 마감 임박 (Soft Deadline)\n\n"
                f"아직 체크하지 않거나 미정인 분들은 출석 여부를 확인 부탁드려요! 🙏\n"
                f"------------------\n"
                f"✅ 참석 ({len(stats['ATTENDING'])}명): {attending_members_str}\n"
                f"🤔 미정 ({len(stats['PENDING'])}명): {pending_members_str}\n"
                f"❌ 불참 ({len(stats['ABSENT'])}명): {absent_members_str}\n"                
                f"------------------\n"
                f"👻 미투표자 ({len(stats['GHOST'])}명): {ghosts_members_str}\n\n"
                f"🔗 출첵: {link}"
            )

        elif n_type == NotificationType.HARD_DEADLINE:
            # Final Roster Check
            return (
                f"{base_msg}"
                f"⛔ 참석 체크 최종 마감 (Hard Deadline)\n\n"
                f"최종 참석 인원을 확인해주세요.\n"
                f"------------------\n"
                f"✅ 참석 ({len(stats['ATTENDING'])}명): {attending_members_str}\n"
                f"❌ 불참 ({len(stats['ABSENT'])}명): {absent_members_str}\n"
                f"------------------\n"
                f"🤔 미정 ({len(stats['PENDING'])}명): {pending_members_str}\n"
                f"👻 미투표자 ({len(stats['GHOST'])}명): {ghosts_members_str}\n"
                f"🔗 아직 미정이거나 미투표자 분들께서는 운영진께 문의해주세요."
            )
        
        return "알림 내용을 생성할 수 없습니다."

    def _get_match_stats(self, match: Match) -> Dict[str, List[str]]:
        """
        Analyzes the match and returns lists of names for each status.
        Target: Only Active Members for the Match's Season.
        """
        # 1. Get All Eligible Members (The Target Audience)
        # We use the method we created in MembershipRepository logic
        # (Assuming you have a helper or we query manually here)
        active_memberships = self.membership_repository.get_all_by_season(
            match.season_id
        )
        eligible_member_ids = {m.member_id for m in active_memberships}

        # Map ID -> Name for easy lookup
        member_map = {m.member.id: m.member.name for m in active_memberships}

        # 2. Get Current Votes
        participations = self.participation_repository.get_all_by_match_id(match.id)

        stats = {
            "ATTENDING": [],
            "ABSENT": [],
            "PENDING": [],
            "GHOST": [],  # Non-voters
        }

        voted_ids = set()

        # 3. Sort Voters into Buckets
        for p in participations:
            if p.member_id not in eligible_member_ids:
                continue  # Skip guests or expired members (optional)

            voted_ids.add(p.member_id)
            name = member_map.get(p.member_id, "Unknown")

            if p.status == ParticipationStatus.ATTENDING:
                stats["ATTENDING"].append(name)
            elif p.status == ParticipationStatus.ABSENT:
                stats["ABSENT"].append(name)
            elif p.status == ParticipationStatus.PENDING:
                stats["PENDING"].append(name)

        # 4. Find Ghosts (Eligible - Voted)
        ghost_ids = eligible_member_ids - voted_ids
        for gid in ghost_ids:
            stats["GHOST"].append(member_map.get(gid, "Unknown"))

        return stats
