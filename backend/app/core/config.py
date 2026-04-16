import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", os.getenv("OPEN_WEATHER_API_KEY", ""))
    WEB_CONCURRENCY: int = 1
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
