"""Application configuration."""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # Security
    secret_key: str = "change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # Optional server-side API keys
    anthropic_api_key: str = ""
    tavily_api_key: str = ""
    
    # Admin configuration
    # Comma-separated list of admin emails
    admin_emails: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"
    
    def get_admin_emails(self) -> list:
        """Get list of admin emails from comma-separated string."""
        if not self.admin_emails:
            return []
        return [email.strip().lower() for email in self.admin_emails.split(",") if email.strip()]

@lru_cache()
def get_settings() -> Settings:
    return Settings()