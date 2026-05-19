"""Application configuration"""

import os
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Sentinel AI"
    DEBUG: bool = True
    API_VERSION: str = "v1"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # Supabase (optional)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # ML Model
    MODEL_NAME: str = "distilbert-base-uncased"
    MODEL_CACHE_DIR: str = "./model_cache"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
