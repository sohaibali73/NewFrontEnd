"""Application configuration."""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Supabase
    supabase_url: str = "https://vekcfcmstpnxubxsaano.supabase.co"
    supabase_key: str = "sb_publishable_Odig0gZO8mEwUYCbUyzbfQ_phRfwF1y"

    # Security
    secret_key: str = "change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # Optional server-side API keys
    anthropic_api_key: str = "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"
    tavily_api_key: str = ""
    
    # Researcher tool API keys
    finnhub_api_key: str = "d5ron0pr01qj5oil831gd5ron0pr01qj5oil8320"
    fred_api_key: str = "816c11e0be7c37119557a6e09de63de5"
    newsapi_key: str = "d0338b913ab7406d92b5e332c96146d3"
    openbb_api_key: str = ""
    sec_api_key: str = ""
    
    # Admin configuration
    # Comma-separated list of admin emails
    admin_emails: str = "sohaib.ali@potomac.com"

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