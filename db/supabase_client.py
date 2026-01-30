"""Supabase client singleton."""

from supabase import create_client, Client
from functools import lru_cache
from config import get_settings

@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """Get Supabase client instance (cached singleton)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)