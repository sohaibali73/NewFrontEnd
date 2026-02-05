"""Supabase client singleton."""

from supabase import create_client, Client
from functools import lru_cache
from config import get_settings
import logging

logger = logging.getLogger(__name__)

@lru_cache(maxsize=1)
def get_supabase() -> Client:
    """
    Get Supabase client instance (cached singleton).
    
    Uses service_role key if available (bypasses RLS for backend operations).
    Falls back to anon key if service_role key is not configured.
    
    WARNING: service_role key has full database access and bypasses RLS.
    Only use it in secure backend code, never expose it to the frontend.
    """
    settings = get_settings()
    
    # Use service_role key if available (recommended for backend)
    if settings.supabase_service_key:
        logger.info("Using Supabase service_role key (bypasses RLS)")
        return create_client(settings.supabase_url, settings.supabase_service_key)
    else:
        logger.warning(
            "Using Supabase anon key. Set SUPABASE_SERVICE_KEY environment variable "
            "for backend operations to bypass RLS policies."
        )
        return create_client(settings.supabase_url, settings.supabase_key)
