"""
Analyst by Potomac - API Server
================================
AI-powered AmiBroker AFL development platform.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
import os

LOG_LEVEL = os.getenv("LOG_LEVEL", "WARNING" if os.getenv("ENVIRONMENT") == "production" else "INFO")
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
# Create FastAPI app
app = FastAPI(
    title="Analyst by Potomac API",
    description="AI-powered AmiBroker AFL development platform",
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

# Import and include routers
# Import and include routers
ROUTERS = [
    ("api.routes.auth", "auth_router", "auth"),
    ("api.routes.chat", "chat_router", "chat"),
    ("api.routes.ai", "ai_router", "ai"),  # New Vercel AI SDK compatible routes
    ("api.routes.afl", "afl_router", "afl"),
    ("api.routes.reverse_engineer", "re_router", "reverse_engineer"),
    ("api.routes.brain", "brain_router", "brain"),
    ("api.routes.backtest", "backtest_router", "backtest"),
    ("api.routes.admin", "admin_router", "admin"),
    ("api.routes.train", "train_router", "train"),
    ("api.routes.researcher", "researcher_router", "researcher"),
]

for module_path, router_name, display_name in ROUTERS:
    try:
        module = __import__(module_path, fromlist=[router_name])
        router = getattr(module, "router")
        app.include_router(router)
        logger.info(f"Loaded {display_name} router")
    except Exception as e:
        import traceback
        logger.error(f"Could not load {display_name} router: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Analyst by Potomac API",
        "version": "1.2.0",
        "status": "online",
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

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
    return {"routes": routes}

@app.get("/debug/routers")
async def debug_routers():
    """Debug endpoint to check router loading status."""
    import traceback
    results = {}
    for module_path, router_name, display_name in ROUTERS:
        try:
            module = __import__(module_path, fromlist=[router_name])
            router = getattr(module, "router", None)
            if router:
                results[display_name] = {"status": "loaded", "routes_count": len(list(router.routes))}
            else:
                results[display_name] = {"status": "error", "message": "router attribute not found"}
        except Exception as e:
            results[display_name] = {"status": "error", "message": str(e), "traceback": traceback.format_exc()}
    return {"router_status": results}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)