"""
Analyst by Potomac - API Server
================================
AI-powered AmiBroker AFL development platform.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Analyst by Potomac API",
    description="AI-powered AmiBroker AFL development platform",
    version="1.0.0",
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
try:
    from api.routes.auth import router as auth_router
    app.include_router(auth_router)
    logger.info("Loaded auth router")
except ImportError as e:
    logger.warning(f"Could not load auth router: {e}")

try:
    from api.routes.chat import router as chat_router
    app.include_router(chat_router)
    logger.info("Loaded chat router")
except ImportError as e:
    logger.warning(f"Could not load chat router: {e}")

try:
    from api.routes.afl import router as afl_router
    app.include_router(afl_router)
    logger.info("Loaded afl router")
except ImportError as e:
    logger.warning(f"Could not load afl router: {e}")

try:
    from api.routes.reverse_engineer import router as re_router
    app.include_router(re_router)
    logger.info("Loaded reverse_engineer router")
except ImportError as e:
    logger.warning(f"Could not load reverse_engineer router: {e}")

try:
    from api.routes.brain import router as brain_router
    app.include_router(brain_router)
    logger.info("Loaded brain router")
except ImportError as e:
    logger.warning(f"Could not load brain router: {e}")

try:
    from api.routes.backtest import router as backtest_router
    app.include_router(backtest_router)
    logger.info("Loaded backtest router")
except ImportError as e:
    logger.warning(f"Could not load backtest router: {e}")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Analyst by Potomac API",
        "version": "1.0.0",
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

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)