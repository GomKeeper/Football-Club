from fastapi import APIRouter, Depends, HTTPException
from app.core.dependencies import get_notification_service
from app.services.notification_service import NotificationService
from app.models import NotificationType
from app.schemas import NotificationSendRequest
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

router = APIRouter()

@router.get("/preview")
def preview_notification(
    match_id: int, 
    type: NotificationType,
    service: NotificationService = Depends(get_notification_service)
):
    """
    Preview what the notification message would look like.
    Does NOT create a DB record.
    """
    return {"message": service.preview_notification(match_id, type)}

@router.post("/generate")
def generate_notification(
    match_id: int, 
    type: NotificationType,
    service: NotificationService = Depends(get_notification_service)
):
    """
    Generates the message and saves it as PENDING in the database.
    This is what the Cron Job or Manager Button will call.
    """
    try:
        notification = service.create_notification(match_id, type)
        return notification
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{id}/send-to-me")
async def send_notification_to_me(
    id: int,
    body: NotificationSendRequest, # 👈 Use the imported schema
    service: NotificationService = Depends(get_notification_service),
):
    """
    Sends the generated notification content to the requesting user's KakaoTalk.
    """
    try:
        await service.send_to_announcer(id, body.kakao_access_token)
        return {"status": "ok", "message": "Notification sent to announcer"}
    except Exception as e:
        # In production, log the actual error for debugging
        print(f"Error sending notification: {e}")
        raise HTTPException(status_code=400, detail=str(e))