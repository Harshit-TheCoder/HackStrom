import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", os.getenv("OPEN_WEATHER_API_KEY", ""))
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
    MAX_LLM_CALLS: int = int(os.getenv("MAX_LLM_CALLS", "5"))
    ENABLE_LLM_CACHE: bool = os.getenv("ENABLE_LLM_CACHE", "True").lower() == "true"
    WEB_CONCURRENCY: int = 1
    
    # Postgres configuration
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "nexus_db")
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def DATABASE_URL(self) -> str:
        # Check if DATABASE_URL is explicitly set (e.g. in docker-compose)
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            return env_url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
