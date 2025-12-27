from typing import List, Optional
from sqlmodel import Session, select
from app.models import Notification, NotificationStatus, NotificationType

class NotificationRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, notification: Notification) -> Notification:
        self.session.add(notification)
        self.session.commit()
        self.session.refresh(notification)
        return notification

    def get_by_match_id(self, match_id: int) -> List[Notification]:
        statement = select(Notification).where(Notification.match_id == match_id)
        return self.session.exec(statement).all()

    def get_by_id(self, notification_id: int) -> Optional[Notification]:
        return self.session.get(Notification, notification_id)

    def get_by_match_id_and_type(self, match_id: int, notification_type: NotificationType) -> Optional[Notification]:
        statement = select(Notification).where(Notification.match_id == match_id).where(Notification.type == notification_type)
        return self.session.exec(statement).first()

    def update_status(self, notification: Notification, status: NotificationStatus) -> Notification:
        notification.status = status
        self.session.add(notification)
        self.session.commit()
        self.session.refresh(notification)
        return notification