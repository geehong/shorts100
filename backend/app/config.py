from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    YOUTUBE_API_KEY: str = ""
    YOUTUBE_API_KEY1: str = ""
    YOUTUBE_API_KEY2: str = ""
    ADMIN_USER: str = "admin"
    ADMIN_PASSWORD: str = "changeme"
    SENTRY_DSN: str = ""
    BACKFILL_LIMIT: int = 10000  # DB 영상 수 상한 (초과 시 수집 중단, 업데이트 전용)
    GOOGLE_OAUTH_KEY: str = ""
    AUTH_SECRET_KEY: str = "shorts100_download_secret_key_change_me_in_prod_12345"

    @property
    def youtube_key1_keys(self) -> list[str]:
        """Key1 전용 키 목록 (YOUTUBE_API_KEY + YOUTUBE_API_KEY1)."""
        keys = []
        if self.YOUTUBE_API_KEY:
            keys.append(self.YOUTUBE_API_KEY)
        if self.YOUTUBE_API_KEY1:
            keys.append(self.YOUTUBE_API_KEY1)
        return keys

    @property
    def youtube_api_keys(self) -> list[str]:
        keys = []
        if self.YOUTUBE_API_KEY:
            keys.append(self.YOUTUBE_API_KEY)
        if self.YOUTUBE_API_KEY1:
            keys.append(self.YOUTUBE_API_KEY1)
        if self.YOUTUBE_API_KEY2:
            keys.append(self.YOUTUBE_API_KEY2)
        return keys
    
    # .env 파일을 읽어오며, 정의되지 않은 변수는 무시합니다.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()