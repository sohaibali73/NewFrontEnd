"""API Routes."""

from .auth import router as auth_router
from .chat import router as chat_router
from .ai import router as ai_router
from .afl import router as afl_router
from .reverse_engineer import router as re_router
from .brain import router as brain_router
from .backtest import router as backtest_router
from .admin import router as admin_router
from .train import router as train_router
from .researcher import router as researcher_router

__all__ = [
    "auth_router",
    "chat_router",
    "ai_router",
    "afl_router",
    "re_router",
    "brain_router",
    "backtest_router",
    "admin_router",
    "train_router",
    "researcher_router",
]
