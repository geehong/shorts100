from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    
    # .env 파일을 읽어오며, 정의되지 않은 변수는 무시합니다.
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()