from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # App Config
    APP_NAME: str = "Football Club Manager"
    API_V1_STR: str = "/api/v1"

    # 🌍 Centralized Timezone Control
    TIMEZONE: str = "Asia/Seoul"

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    encryption_key: Optional[str] = None
    cron_secret: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
