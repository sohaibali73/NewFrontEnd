"""Application configuration."""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Supabase - MUST be set via environment variables
    supabase_url: str = ""
    supabase_key: str = ""  # anon/public key
    supabase_service_key: str = ""  # service_role key (required for backend operations with RLS)

    # Data Encryption at Rest - MUST be set via environment variable
    # Generate a secure 32-byte key: python -c "import secrets; print(secrets.token_urlsafe(32))"
    encryption_key: str = ""  # Used for encrypting sensitive data like API keys

    # Security - MUST be changed in production via environment variables
    # Note: These are DEPRECATED - Supabase Auth handles JWT tokens
    secret_key: str = "change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7

    # Optional server-side API keys - set via environment variables
    anthropic_api_key: str = ""
    tavily_api_key: str = ""
    
    # Vercel AI Gateway (optional - falls back to direct Anthropic API)
    vercel_ai_gateway_url: str = ""  # e.g., "https://gateway.ai.vercel.app/v1"
    
    # Default AI model
    default_ai_model: str = "claude-sonnet-4-20250514"
    
    # Researcher tool API keys - set via environment variables
    finnhub_api_key: str = ""
    fred_api_key: str = ""
    newsapi_key: str = ""

    # SMTP settings for password reset emails
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_sender_email: str = ""
    smtp_password: str = ""
    
    # Frontend URL for password reset links
    frontend_url: str = "https://analystbypotomac.vercel.app"

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