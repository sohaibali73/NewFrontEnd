"""
Analyst by Potomac - API Server
================================
AI-powered AmiBroker AFL development platform.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os
import traceback

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "WARNING" if os.getenv("ENVIRONMENT") == "production" else "INFO")
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Analyst by Potomac API",
    description="AI-powered AmiBroker AFL development platform with streaming support",
    version="1.2.0",
)

# CORS middleware — locked down to allowed origins only
_ALLOWED_ORIGINS = [
    "https://analystbypotomac.vercel.app",
    "https://www.analystbypotomac.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
]
# Allow additional origins from FRONTEND_URL env var
_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url and _frontend_url not in _ALLOWED_ORIGINS:
    _ALLOWED_ORIGINS.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Simple in-memory rate limiting middleware
from collections import defaultdict
import time as _time

_rate_limit_store: dict = defaultdict(list)
_RATE_LIMIT_WINDOW = 60  # seconds
_RATE_LIMIT_MAX_REQUESTS = 120  # max requests per window per IP


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting — 120 requests/minute per IP. Skips health/docs."""
    path = request.url.path
    # Skip rate limiting for health checks and docs
    if path in ("/health", "/", "/docs", "/openapi.json", "/routes", "/redoc"):
        return await call_next(request)
    
    client_ip = request.client.host if request.client else "unknown"
    now = _time.time()
    
    # Clean old entries
    _rate_limit_store[client_ip] = [
        t for t in _rate_limit_store[client_ip] if now - t < _RATE_LIMIT_WINDOW
    ]
    
    if len(_rate_limit_store[client_ip]) >= _RATE_LIMIT_MAX_REQUESTS:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded. Try again in a minute."},
            headers={"Retry-After": "60", "Access-Control-Allow-Origin": "*"},
        )
    
    _rate_limit_store[client_ip].append(now)
    
    # Prune store periodically (every ~1000 requests)
    if len(_rate_limit_store) > 1000:
        cutoff = now - _RATE_LIMIT_WINDOW * 2
        stale_ips = [ip for ip, times in _rate_limit_store.items() if not times or times[-1] < cutoff]
        for ip in stale_ips:
            del _rate_limit_store[ip]
    
    return await call_next(request)


# Global exception handler - ensures CORS headers are always present on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return safe JSON with CORS headers."""
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    # Don't leak internal error details to clients in production
    is_production = os.getenv("ENVIRONMENT") == "production" or os.getenv("RAILWAY_ENVIRONMENT")
    origin = request.headers.get("origin", "")
    cors_origin = origin if origin in _ALLOWED_ORIGINS else _ALLOWED_ORIGINS[0]
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error" if is_production else str(exc),
            "type": "ServerError" if is_production else type(exc).__name__,
        },
        headers={
            "Access-Control-Allow-Origin": cors_origin,
            "Access-Control-Allow-Credentials": "true",
        },
    )


# Explicit router imports - safer and clearer than dynamic loading
logger.info("Loading routers...")

# Load routers with individual error handling
routers_loaded = []
routers_failed = []

try:
    from api.routes import auth
    app.include_router(auth.router)
    routers_loaded.append("auth")
    logger.info("✓ Loaded auth router")
except Exception as e:
    routers_failed.append(("auth", str(e)))
    logger.error(f"✗ Failed to load auth router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import chat
    app.include_router(chat.router)
    routers_loaded.append("chat")
    logger.info("✓ Loaded chat router")
except Exception as e:
    routers_failed.append(("chat", str(e)))
    logger.error(f"✗ Failed to load chat router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import ai
    app.include_router(ai.router)
    routers_loaded.append("ai")
    logger.info("✓ Loaded ai router (Vercel AI SDK streaming)")
except Exception as e:
    routers_failed.append(("ai", str(e)))
    logger.error(f"✗ Failed to load ai router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import afl
    app.include_router(afl.router)
    routers_loaded.append("afl")
    logger.info("✓ Loaded afl router")
except Exception as e:
    routers_failed.append(("afl", str(e)))
    logger.error(f"✗ Failed to load afl router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import reverse_engineer
    app.include_router(reverse_engineer.router)
    routers_loaded.append("reverse_engineer")
    logger.info("✓ Loaded reverse_engineer router")
except Exception as e:
    routers_failed.append(("reverse_engineer", str(e)))
    logger.error(f"✗ Failed to load reverse_engineer router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import brain
    app.include_router(brain.router)
    routers_loaded.append("brain")
    logger.info("✓ Loaded brain router")
except Exception as e:
    routers_failed.append(("brain", str(e)))
    logger.error(f"✗ Failed to load brain router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import backtest
    app.include_router(backtest.router)
    routers_loaded.append("backtest")
    logger.info("✓ Loaded backtest router")
except Exception as e:
    routers_failed.append(("backtest", str(e)))
    logger.error(f"✗ Failed to load backtest router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import admin
    app.include_router(admin.router)
    routers_loaded.append("admin")
    logger.info("✓ Loaded admin router")
except Exception as e:
    routers_failed.append(("admin", str(e)))
    logger.error(f"✗ Failed to load admin router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import train
    app.include_router(train.router)
    routers_loaded.append("train")
    logger.info("✓ Loaded train router")
except Exception as e:
    routers_failed.append(("train", str(e)))
    logger.error(f"✗ Failed to load train router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import researcher
    app.include_router(researcher.router)
    routers_loaded.append("researcher")
    logger.info("✓ Loaded researcher router")
except Exception as e:
    routers_failed.append(("researcher", str(e)))
    logger.error(f"✗ Failed to load researcher router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import health
    app.include_router(health.router)
    routers_loaded.append("health")
    logger.info("✓ Loaded health router (database diagnostics)")
except Exception as e:
    routers_failed.append(("health", str(e)))
    logger.error(f"✗ Failed to load health router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import upload
    app.include_router(upload.router)
    routers_loaded.append("upload")
    logger.info("✓ Loaded upload router (Supabase Storage file uploads)")
except Exception as e:
    routers_failed.append(("upload", str(e)))
    logger.error(f"✗ Failed to load upload router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import content
    app.include_router(content.router)
    routers_loaded.append("content")
    logger.info("✓ Loaded content router (articles, documents, slides, dashboards)")
except Exception as e:
    routers_failed.append(("content", str(e)))
    logger.error(f"✗ Failed to load content router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import presentations
    app.include_router(presentations.router)
    routers_loaded.append("presentations")
    logger.info("✓ Loaded presentations router (Potomac PPTX generation)")
except Exception as e:
    routers_failed.append(("presentations", str(e)))
    logger.error(f"✗ Failed to load presentations router: {e}")
    logger.debug(traceback.format_exc())

try:
    from pptx_engine.routes import router as pptx_engine_router
    app.include_router(pptx_engine_router)
    routers_loaded.append("pptx_engine")
    logger.info("✓ Loaded pptx_engine router (PPTX assembly & templates)")
except Exception as e:
    routers_failed.append(("pptx_engine", str(e)))
    logger.error(f"✗ Failed to load pptx_engine router: {e}")
    logger.debug(traceback.format_exc())

try:
    from pptx_engine.generate import generate_router
    app.include_router(generate_router)
    routers_loaded.append("pptx_generate")
    logger.info("✓ Loaded pptx_generate router (Claude → PPTX pipeline)")
except Exception as e:
    routers_failed.append(("pptx_generate", str(e)))
    logger.error(f"✗ Failed to load pptx_generate router: {e}")
    logger.debug(traceback.format_exc())

try:
    from api.routes import voice_assistant
    app.include_router(voice_assistant.router)
    routers_loaded.append("voice_assistant")
    logger.info("✓ Loaded voice_assistant router (Open source voice assistant)")
except Exception as e:
    routers_failed.append(("voice_assistant", str(e)))
    logger.error(f"✗ Failed to load voice_assistant router: {e}")
    logger.debug(traceback.format_exc())

# Log summary
logger.info(f"Router loading complete: {len(routers_loaded)} loaded, {len(routers_failed)} failed")
if routers_failed:
    logger.warning(f"Failed routers: {[name for name, _ in routers_failed]}")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Analyst by Potomac API",
        "version": "1.2.0",
        "status": "online",
        "routers_loaded": routers_loaded,
        "routers_failed": [name for name, _ in routers_failed] if routers_failed else None,
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "routers_active": len(routers_loaded),
        "routers_failed": len(routers_failed),
    }

# Debug/diagnostic endpoints removed from production for security.
# Use /admin/health/system for diagnostics (requires admin auth).

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))

    logger.info(f"Starting Analyst by Potomac API server on port {port}")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Log level: {LOG_LEVEL}")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level=LOG_LEVEL.lower()
    )