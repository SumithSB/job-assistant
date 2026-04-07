from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    jwt_secret: str = "dev-insecure-change-me"
    jwt_expire_hours: int = 24
    cors_origins: str = "http://localhost:5173"
    auth_mode: str = "local"
    storage_backend: str = "none"
    llm_provider: str = "mock"
    llm_model: str = "llama3.2"
    llm_base_url: str | None = None
    llm_api_key: str | None = None
    # Use Ollama /api/chat + JSON schema for local models that ignore prompt-only shapes.
    llm_ollama_force_native_schema: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
