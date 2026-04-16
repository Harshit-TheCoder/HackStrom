import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", os.getenv("GOOGLE_API_KEY", ""))
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", os.getenv("OPEN_WEATHER_API_KEY", ""))
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")  # Switch to OpenAI
    MAX_LLM_CALLS: int = int(os.getenv("MAX_LLM_CALLS", "5"))
    ENABLE_LLM_CACHE: bool = os.getenv("ENABLE_LLM_CACHE", "True").lower() == "true"
    WEB_CONCURRENCY: int = 1
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
