import os
import json
import hashlib
from typing import Optional, Any
from app.core.config import settings

class LLMCache:
    """Persistent JSON-based cache for LLM responses."""
    def __init__(self, cache_file: str = "app/data/llm_cache.json"):
        self.cache_file = cache_file
        self.cache_dir = os.path.dirname(self.cache_file)
        self._ensure_cache_dir()
        self.cache = self._load_cache()

    def _ensure_cache_dir(self):
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir, exist_ok=True)

    def _load_cache(self) -> dict:
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r") as f:
                    data = json.load(f)
                    # Support legacy cache formats
                    if isinstance(data, dict):
                        return data if "entries" in data else {"entries": data, "api_calls": 0}
            except Exception as e:
                print(f"Error loading LLM cache: {e}")
        return {"entries": {}, "api_calls": 0}

    def _save_cache(self):
        try:
            with open(self.cache_file, "w") as f:
                json.dump(self.cache, f, indent=2)
        except Exception as e:
            print(f"Error saving LLM cache: {e}")

    def get_api_call_count(self) -> int:
        return self.cache.get("api_calls", 0)

    def increment_api_call_count(self):
        self.cache["api_calls"] = self.cache.get("api_calls", 0) + 1
        self._save_cache()

    def get_key(self, prompt: str, schema_name: str) -> str:
        """Generate a unique key based on prompt and schema."""
        combined = f"{schema_name}:{prompt}"
        return hashlib.sha256(combined.encode()).hexdigest()

    def get(self, prompt: str, schema_name: str) -> Optional[dict]:
        if not settings.ENABLE_LLM_CACHE:
            return None
        key = self.get_key(prompt, schema_name)
        return self.cache.get("entries", {}).get(key)

    def set(self, prompt: str, schema_name: str, response: dict):
        if not settings.ENABLE_LLM_CACHE:
            return
        key = self.get_key(prompt, schema_name)
        if "entries" not in self.cache:
            self.cache["entries"] = {}
        self.cache["entries"][key] = response
        self._save_cache()

llm_cache = LLMCache()
