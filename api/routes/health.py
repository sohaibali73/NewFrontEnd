"""Health check and diagnostic routes."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from datetime import datetime

from db.supabase_client import get_supabase
from config import get_settings
from core.encryption import encrypt_value, decrypt_value

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Potomac Analyst Workbench API"
    }


@router.get("/db")
async def database_health() -> Dict[str, Any]:
    """
    Check database connectivity and required tables.
    Verifies that all critical tables exist and are accessible.
    """
    db = get_supabase()
    settings = get_settings()
    
    results = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "url": settings.supabase_url,
            "using_service_role": bool(settings.supabase_service_key),
        },
        "tables": {},
        "errors": []
    }
    
    # List of critical tables to check
    critical_tables = [
        "user_profiles",
        "conversations",
        "messages",
        "afl_codes",
        "afl_history",
        "reverse_engineer_history",
        "training_data",
        "user_feedback",
        "brain_documents",
    ]
    
    for table_name in critical_tables:
        try:
            # Try to query the table (limit 1 to minimize load)
            result = db.table(table_name).select("*").limit(1).execute()
            results["tables"][table_name] = {
                "exists": True,
                "accessible": True,
                "sample_count": len(result.data)
            }
        except Exception as e:
            error_msg = str(e)
            results["tables"][table_name] = {
                "exists": "PGRST205" not in error_msg,  # PGRST205 = table not found
                "accessible": False,
                "error": error_msg
            }
            results["errors"].append(f"{table_name}: {error_msg}")
            logger.error(f"Table '{table_name}' check failed: {e}")
    
    # Check for missing critical tables
    missing_tables = [
        table for table, info in results["tables"].items() 
        if not info.get("exists", False)
    ]
    
    if missing_tables:
        results["status"] = "degraded"
        results["missing_tables"] = missing_tables
        results["recommendation"] = (
            "Run database migrations in Supabase SQL Editor. "
            "Missing tables: " + ", ".join(missing_tables)
        )
    
    # Check for inaccessible tables (RLS issues)
    inaccessible_tables = [
        table for table, info in results["tables"].items() 
        if info.get("exists", False) and not info.get("accessible", False)
    ]
    
    if inaccessible_tables:
        results["status"] = "degraded"
        results["inaccessible_tables"] = inaccessible_tables
        if not settings.supabase_service_key:
            results["recommendation"] = (
                "Set SUPABASE_SERVICE_KEY environment variable to bypass RLS policies. "
                "Inaccessible tables: " + ", ".join(inaccessible_tables)
            )
    
    return results


@router.get("/config")
async def config_check() -> Dict[str, Any]:
    """
    Check configuration status (safe - no secrets exposed).
    """
    settings = get_settings()
    
    return {
        "supabase": {
            "url_configured": bool(settings.supabase_url),
            "anon_key_configured": bool(settings.supabase_key),
            "service_key_configured": bool(settings.supabase_service_key),
            "recommendation": (
                "Configure SUPABASE_SERVICE_KEY for backend operations"
                if not settings.supabase_service_key else None
            )
        },
        "api_keys": {
            "anthropic_configured": bool(settings.anthropic_api_key),
            "tavily_configured": bool(settings.tavily_api_key),
            "finnhub_configured": bool(settings.finnhub_api_key),
            "fred_configured": bool(settings.fred_api_key),
            "newsapi_configured": bool(settings.newsapi_key),
        },
        "smtp": {
            "configured": bool(settings.smtp_sender_email and settings.smtp_password),
        },
        "admin": {
            "admin_emails_configured": len(settings.get_admin_emails()) > 0,
            "admin_count": len(settings.get_admin_emails()),
        }
    }


@router.get("/migrations")
async def check_migrations() -> Dict[str, Any]:
    """
    Check which migrations have been applied.
    Useful for diagnosing missing table issues.
    """
    db = get_supabase()
    
    # Expected tables from each migration
    migration_tables = {
        "001_training_data": ["training_data"],
        "002_feedback_analytics": ["user_feedback"],
        "003_researcher_tables": ["brain_documents", "brain_chunks", "learnings"],
        "004_history_tables": ["afl_history", "reverse_engineer_history"],
        "005_afl_uploaded_files": ["afl_uploaded_files"],
        "006_afl_settings_presets": ["afl_settings_presets"],
    }
    
    results = {
        "migrations": {},
        "missing_migrations": [],
        "recommendation": None
    }
    
    for migration_name, tables in migration_tables.items():
        all_exist = True
        missing = []
        
        for table in tables:
            try:
                db.table(table).select("*").limit(1).execute()
            except Exception as e:
                if "PGRST205" in str(e):  # Table not found
                    all_exist = False
                    missing.append(table)
        
        results["migrations"][migration_name] = {
            "applied": all_exist,
            "tables": tables,
            "missing_tables": missing if not all_exist else []
        }
        
        if not all_exist:
            results["missing_migrations"].append(migration_name)
    
    if results["missing_migrations"]:
        results["recommendation"] = (
            f"Run these migrations in Supabase SQL Editor: "
            f"{', '.join(results['missing_migrations'])}"
        )
    
    return results


@router.get("/debug-encryption")
async def debug_encryption() -> Dict[str, Any]:
    """
    TEMPORARY: Debug encryption roundtrip and stored API key format.
    Remove after diagnosing the 401 issue.
    """
    settings = get_settings()
    db = get_supabase()
    
    result = {
        "encryption_key_set": bool(settings.encryption_key),
        "encryption_key_length": len(settings.encryption_key) if settings.encryption_key else 0,
    }
    
    # Test encrypt/decrypt roundtrip
    try:
        test_value = "sk-ant-test-1234567890"
        encrypted = encrypt_value(test_value)
        decrypted = decrypt_value(encrypted)
        result["roundtrip_test"] = {
            "original": test_value,
            "encrypted_prefix": encrypted[:20],
            "decrypted_matches": decrypted == test_value,
        }
    except Exception as e:
        result["roundtrip_test"] = {"error": str(e)}
    
    # Check stored key for user
    try:
        user_result = db.table("user_profiles").select(
            "id, claude_api_key_encrypted"
        ).eq("id", "f52cd56f-f55a-4029-aa55-56f87da0a632").execute()
        
        if user_result.data:
            row = user_result.data[0]
            raw = row.get("claude_api_key_encrypted") or ""
            result["stored_key"] = {
                "raw_length": len(raw),
                "starts_with_enc": raw.startswith("enc:") if raw else False,
                "raw_first_25": raw[:25] if raw else "(empty)",
            }
            
            if raw:
                try:
                    decrypted_key = decrypt_value(raw)
                    result["stored_key"]["decrypted_length"] = len(decrypted_key)
                    result["stored_key"]["decrypted_first_12"] = decrypted_key[:12] if decrypted_key else "(empty)"
                    result["stored_key"]["decrypted_last_4"] = decrypted_key[-4:] if decrypted_key else "(empty)"
                    result["stored_key"]["looks_like_anthropic_key"] = decrypted_key.startswith("sk-ant-")
                except Exception as e:
                    result["stored_key"]["decrypt_error"] = str(e)
        else:
            result["stored_key"] = "user not found"
    except Exception as e:
        result["stored_key_error"] = str(e)
    
    return result
