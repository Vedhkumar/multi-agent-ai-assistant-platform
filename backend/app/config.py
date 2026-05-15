"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # --- Environment ---
    environment: str = Field(default="development", alias="ENVIRONMENT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # --- Database ---
    database_url: str = Field(
        default="postgresql+asyncpg://admin:changeme@localhost:5432/agents",
        alias="DATABASE_URL",
    )

    # --- Redis ---
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1", alias="CELERY_BROKER_URL"
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/2", alias="CELERY_RESULT_BACKEND"
    )

    # --- JWT Auth ---
    jwt_secret_key: str = Field(
        default="dev-secret-key-change-in-production", alias="JWT_SECRET_KEY"
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=30, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    jwt_refresh_token_expire_days: int = Field(
        default=7, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS"
    )

    # --- OpenAI ---
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")

    # --- Tavily ---
    tavily_api_key: str = Field(default="", alias="TAVILY_API_KEY")

    # --- E2B ---
    e2b_api_key: str = Field(default="", alias="E2B_API_KEY")

    # --- Langfuse ---
    langfuse_secret_key: str = Field(default="", alias="LANGFUSE_SECRET_KEY")
    langfuse_public_key: str = Field(default="", alias="LANGFUSE_PUBLIC_KEY")
    langfuse_host: str = Field(
        default="http://localhost:3001", alias="LANGFUSE_HOST"
    )

    # --- App Limits ---
    max_iterations: int = Field(default=10, alias="MAX_ITERATIONS")
    max_tokens_per_task: int = Field(default=50000, alias="MAX_TOKENS_PER_TASK")
    rate_limit_per_minute: int = Field(default=10, alias="RATE_LIMIT_PER_MINUTE")

    model_config = {"env_file": ".env", "extra": "ignore", "populate_by_name": True}


# Singleton settings instance
settings = Settings()
