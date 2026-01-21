"""Database module."""

from supabase import create_client, Client
from config import get_settings

_client: Client = None

def get_db() -> Client:
    """Get Supabase client instance."""
    global _client

    if _client is None:
        settings = get_settings()
        if settings.supabase_url and settings.supabase_key:
            _client = create_client(settings.supabase_url, settings.supabase_key)

    return _client

def get_supabase() -> Client:
    """Alias for get_db() - for compatibility."""
    return get_db()

__all__ = ["get_db", "get_supabase"]
