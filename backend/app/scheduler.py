from apscheduler.schedulers.background import BackgroundScheduler
from sqlmodel import Session
from datetime import datetime, UTC

from app.db import engine
from app.models import NotificationType

# Repositories
from app.repositories.match_repository import MatchRepository
from app.repositories.notification_repository import NotificationRepository

# Services
from app.services.match_service import MatchService
from app.services.notification_service import NotificationService

def check_upcoming_notifications():
    """
    Orchestrates the notification check using Services.
    """
    print(f"🕵️ [Scheduler] Running Job at {datetime.now(UTC)}...")

    # 1. Manual Dependency Injection (Since we are outside HTTP Context)
    with Session(engine) as session:
        # Repositories
        match_repo = MatchRepository(session)
        noti_repo = NotificationRepository(session)
        
        # Services 
        # (Pass None for dependencies irrelevant to this specific task to keep it light)
        match_service = MatchService(match_repo, None, None) 
        notification_service = NotificationService(noti_repo, None, None, None, None) 

        # 2. Get Matches via Service
        matches = match_service.get_schedulable_matches()

        # 3. Process each match via Service
        for match in matches:
            # We explicitly define the rules here (Strategy Pattern could also work)
            milestones = [
                (NotificationType.POLLING_START, match.polling_start_at),
                (NotificationType.SOFT_DEADLINE, match.soft_deadline_at),
                (NotificationType.HARD_DEADLINE, match.hard_deadline_at),
            ]

            for notification_type, trigger_time in milestones:
                # Ask Service to handle the logic
                notification_service.ensure_pending_task(match.id, notification_type, trigger_time)

# Scheduler Setup (Unchanged)
scheduler = BackgroundScheduler()

def start_scheduler():
    if not scheduler.get_jobs():
        # Check every 1 minute for responsiveness during testing
        scheduler.add_job(check_upcoming_notifications, 'interval', minutes=5)
        scheduler.start()
        print("🚀 [Scheduler] Service-based Scheduler started.")

def shutdown_scheduler():
    scheduler.shutdown()