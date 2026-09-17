import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "CoopConnect"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./coopconnect.db")
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "coopconnect-super-secret-jwt-key-2026-sih")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Demo settings
    DEMO_MODE: bool = True
    
    class Config:
        case_sensitive = True

settings = Settings()
