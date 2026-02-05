"""
Analyst by Potomac - API Server
================================
AI-powered AmiBroker AFL development platform.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

@app.get("/routes")
async def list_routes():
    """List all available routes."""
    routes = []
    for route in app.routes:
        if hasattr(route, "path") and hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else [],
                "name": route.name,
            })
    return {"routes": routes, "total": len(routes)}

@app.get("/debug/routers")
async def debug_routers():
    """Debug endpoint to check router loading status."""
    results = {}

    # Show loaded routers
    for router_name in routers_loaded:
        results[router_name] = {
            "status": "loaded",
            "message": "Router successfully loaded and registered"
        }

    # Show failed routers with error details
    for router_name, error in routers_failed:
        results[router_name] = {
            "status": "failed",
            "error": error,
            "message": "Router failed to load - check logs for details"
        }

    return {
        "router_status": results,
        "summary": {
            "total_routers": len(routers_loaded) + len(routers_failed),
            "loaded": len(routers_loaded),
            "failed": len(routers_failed),
        }
    }

@app.get("/debug/missing-modules")
async def debug_missing_modules():
    """Check which router modules exist in the file system."""
    import os

    routes_dir = "api/routes"
    expected_modules = [
        "auth", "chat", "ai", "afl", "reverse_engineer",
        "brain", "backtest", "admin", "train", "researcher"
    ]

    module_status = {}

    for module_name in expected_modules:
        module_file = f"{routes_dir}/{module_name}.py"
        exists = os.path.exists(module_file)
        module_status[module_name] = {
            "file_path": module_file,
            "exists": exists,
            "loaded": module_name in routers_loaded,
            "failed": module_name in [name for name, _ in routers_failed],
        }

    # Check for __init__.py files
    init_files = {
        "api/__init__.py": os.path.exists("api/__init__.py"),
        "api/routes/__init__.py": os.path.exists("api/routes/__init__.py"),
    }

    return {
        "module_status": module_status,
        "init_files": init_files,
        "warning": "Missing __init__.py files will cause import errors!" if not all(init_files.values()) else None
    }

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