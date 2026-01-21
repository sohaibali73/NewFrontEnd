"""Supabase client singleton."""

from supabase import create_client, Client
from config import get_settings

_client: Client = None

def get_supabase() -> Client:
    """Get Supabase client instance."""
    global _client

    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_key)

    return _client
