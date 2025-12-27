from datetime import datetime, UTC

# Korean Day of Week Map
KR_WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"]

def ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    
    return dt.astimezone(UTC)