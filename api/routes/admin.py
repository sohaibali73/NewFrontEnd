"""
Admin Routes - Admin panel backend for AI training and management.
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel

from api.routes.auth import get_current_user_id
from db.supabase_client import get_supabase
from core.training import get_training_manager, TrainingType
from config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


# =============================================================================
# Admin Authentication
# =============================================================================

def get_admin_emails() -> list:
    """
    Get list of admin emails from config and fallback defaults.
    
    Admin emails can be configured via:
    1. ADMIN_EMAILS environment variable (comma-separated)
    2. Fallback hardcoded list
    """
    settings = get_settings()
    config_emails = settings.get_admin_emails()
    
    # Fallback defaults if no config provided
    default_emails = [
        "admin@potomac.com",
        "sohaib@potomac.com",
    ]
    
    # Combine and deduplicate
    all_emails = set(email.lower() for email in config_emails + default_emails)
    return list(all_emails)


async def verify_admin(user_id: str = Depends(get_current_user_id)) -> str:
    """
    Verify that the current user is an admin.
    
    Checks:
    1. User exists
    2. User email is in admin list OR user has is_admin flag
    """
    db = get_supabase()
    
    result = db.table("users").select("id, email, is_admin").eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = result.data[0]
    email = user.get("email", "")
    is_admin = user.get("is_admin", False)
    
    # Get admin emails from config
    admin_emails = get_admin_emails()
    
    # Check if user is admin
    if not is_admin and email.lower() not in admin_emails:
        raise HTTPException(
            status_code=403, 
            detail="Admin access required. Contact support to get admin privileges."
        )
    
    return user_id


# =============================================================================
# Pydantic Models
# =============================================================================

class TrainingExampleCreate(BaseModel):
    """Model for creating a training example."""
    training_type: str  # example, rule, correction, pattern, anti_pattern, terminology
    title: str
    input_prompt: str
    expected_output: str
    explanation: Optional[str] = ""
    category: Optional[str] = "afl"
    tags: Optional[List[str]] = []
    priority: Optional[int] = 5


class TrainingExampleUpdate(BaseModel):
    """Model for updating a training example."""
    training_type: Optional[str] = None
    title: Optional[str] = None
    input_prompt: Optional[str] = None
    expected_output: Optional[str] = None
    explanation: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class CorrectionCreate(BaseModel):
    """Model for adding a correction from feedback."""
    original_prompt: str
    wrong_output: str
    correct_output: str
    feedback: str


class BatchImport(BaseModel):
    """Model for batch importing training data."""
    items: List[TrainingExampleCreate]


class QuickTrain(BaseModel):
    """Model for quick training - simplified input."""
    what_to_learn: str  # The rule or pattern to learn
    example_input: Optional[str] = ""
    example_output: Optional[str] = ""
    training_type: Optional[str] = "rule"


# =============================================================================
# Admin Status Routes
# =============================================================================

@router.get("/status")
async def admin_status(admin_id: str = Depends(verify_admin)):
    """Check admin status and get system overview."""
    db = get_supabase()
    training_manager = get_training_manager()
    
    # Get user counts
    users = db.table("users").select("id", count="exact").execute()
    
    # Get training stats
    training_stats = training_manager.get_training_stats()
    
    # Get document counts
    try:
        docs = db.table("brain_documents").select("id", count="exact").execute()
        doc_count = docs.count or 0
    except:
        doc_count = 0
    
    return {
        "status": "admin",
        "admin_id": admin_id,
        "stats": {
            "total_users": users.count or 0,
            "total_documents": doc_count,
            "training": training_stats,
        }
    }


@router.post("/make-admin/{target_user_id}")
async def make_user_admin(
    target_user_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Make another user an admin."""
    db = get_supabase()
    
    result = db.table("users").update({"is_admin": True}).eq("id", target_user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    return {"status": "success", "message": f"User {target_user_id} is now an admin"}


@router.post("/revoke-admin/{target_user_id}")
async def revoke_admin(
    target_user_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Revoke admin privileges from a user."""
    db = get_supabase()
    
    # Prevent revoking own admin
    if target_user_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot revoke your own admin privileges")
    
    result = db.table("users").update({"is_admin": False}).eq("id", target_user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    return {"status": "success", "message": f"Admin privileges revoked from user {target_user_id}"}


# =============================================================================
# Training Routes
# =============================================================================

@router.post("/train")
async def add_training(
    data: TrainingExampleCreate,
    admin_id: str = Depends(verify_admin),
):
    """
    Add a new training example to teach the AI.
    
    Training types:
    - example: Input/output example pairs
    - rule: Rules the AI must follow
    - pattern: Code patterns to use
    - anti_pattern: Patterns to avoid
    - correction: Corrections to previous mistakes
    - terminology: Domain-specific terms
    """
    training_manager = get_training_manager()
    
    # Validate training type
    valid_types = [t.value for t in TrainingType]
    if data.training_type not in valid_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid training_type. Must be one of: {valid_types}"
        )
    
    result = training_manager.add_training_example(
        training_type=data.training_type,
        title=data.title,
        input_prompt=data.input_prompt,
        expected_output=data.expected_output,
        explanation=data.explanation,
        category=data.category,
        tags=data.tags,
        priority=data.priority,
        created_by=admin_id,
    )
    
    return result


@router.post("/train/quick")
async def quick_train(
    data: QuickTrain,
    admin_id: str = Depends(verify_admin),
):
    """
    Quick training - simplified way to teach the AI something new.
    
    Just provide what you want the AI to learn and optionally an example.
    """
    training_manager = get_training_manager()
    
    # Create appropriate training entry based on input
    if data.example_input and data.example_output:
        # If both example input/output provided, create an example
        result = training_manager.add_training_example(
            training_type="example",
            title=data.what_to_learn[:100],
            input_prompt=data.example_input,
            expected_output=data.example_output,
            explanation=data.what_to_learn,
            category="afl",
            priority=7,
            created_by=admin_id,
        )
    else:
        # Otherwise create a rule
        result = training_manager.add_training_example(
            training_type=data.training_type,
            title=data.what_to_learn[:100],
            input_prompt=data.example_input or "Always apply this rule",
            expected_output=data.what_to_learn,
            explanation="Admin-defined rule",
            category="afl",
            priority=7,
            created_by=admin_id,
        )
    
    return result


@router.post("/train/correction")
async def add_correction(
    data: CorrectionCreate,
    admin_id: str = Depends(verify_admin),
):
    """
    Add a correction when the AI made a mistake.
    
    Provide the original prompt, what the AI generated (wrong),
    what it should have generated (correct), and feedback explaining the issue.
    """
    training_manager = get_training_manager()
    
    result = training_manager.add_correction_from_feedback(
        original_prompt=data.original_prompt,
        wrong_output=data.wrong_output,
        correct_output=data.correct_output,
        feedback=data.feedback,
        created_by=admin_id,
    )
    
    return result


@router.post("/train/batch")
async def batch_import_training(
    data: BatchImport,
    admin_id: str = Depends(verify_admin),
):
    """Import multiple training examples at once."""
    training_manager = get_training_manager()
    
    items = [item.dict() for item in data.items]
    result = training_manager.import_training_batch(items, created_by=admin_id)
    
    return result


@router.get("/training")
async def list_training(
    training_type: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = True,
    limit: int = 100,
    admin_id: str = Depends(verify_admin),
):
    """List all training examples with optional filtering."""
    training_manager = get_training_manager()
    
    examples = training_manager.list_training_examples(
        training_type=training_type,
        category=category,
        is_active=is_active,
        limit=limit,
    )
    
    return {"count": len(examples), "examples": examples}


@router.get("/training/{training_id}")
async def get_training(
    training_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Get a single training example."""
    training_manager = get_training_manager()
    
    example = training_manager.get_training_example(training_id)
    
    if not example:
        raise HTTPException(status_code=404, detail="Training example not found")
    
    return example


@router.put("/training/{training_id}")
async def update_training(
    training_id: str,
    data: TrainingExampleUpdate,
    admin_id: str = Depends(verify_admin),
):
    """Update a training example."""
    training_manager = get_training_manager()
    
    # Filter out None values
    updates = {k: v for k, v in data.dict().items() if v is not None}
    
    if not updates:
        raise HTTPException(status_code=400, detail="No updates provided")
    
    result = training_manager.update_training_example(training_id, updates)
    
    return result


@router.delete("/training/{training_id}")
async def delete_training(
    training_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Delete a training example."""
    training_manager = get_training_manager()
    
    result = training_manager.delete_training_example(training_id)
    
    return result


@router.post("/training/{training_id}/toggle")
async def toggle_training(
    training_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Toggle a training example's active status."""
    training_manager = get_training_manager()
    
    # Get current state
    example = training_manager.get_training_example(training_id)
    if not example:
        raise HTTPException(status_code=404, detail="Training example not found")
    
    # Toggle
    new_state = not example.get("is_active", True)
    result = training_manager.update_training_example(training_id, {"is_active": new_state})
    
    return {"status": "success", "is_active": new_state}


@router.get("/training/stats/overview")
async def training_stats(admin_id: str = Depends(verify_admin)):
    """Get training statistics."""
    training_manager = get_training_manager()
    return training_manager.get_training_stats()


@router.get("/training/export/all")
async def export_training(
    training_type: Optional[str] = None,
    category: Optional[str] = None,
    admin_id: str = Depends(verify_admin),
):
    """Export all training data for backup."""
    training_manager = get_training_manager()
    
    data = training_manager.export_training_data(
        training_type=training_type,
        category=category,
    )
    
    return {"count": len(data), "data": data}


@router.get("/training/context/preview")
async def preview_training_context(
    category: Optional[str] = None,
    admin_id: str = Depends(verify_admin),
):
    """
    Preview the training context that gets injected into AI prompts.
    
    This shows you exactly what the AI "knows" from training.
    """
    training_manager = get_training_manager()
    
    context = training_manager.get_training_context(category=category)
    
    return {
        "context_length": len(context),
        "context": context,
    }


# =============================================================================
# User Management Routes
# =============================================================================

@router.get("/users")
async def list_users(
    limit: int = 100,
    admin_id: str = Depends(verify_admin),
):
    """List all users."""
    db = get_supabase()
    
    result = db.table("users").select(
        "id, email, name, nickname, is_admin, created_at, last_active"
    ).limit(limit).execute()
    
    return {"count": len(result.data), "users": result.data}


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Get a specific user's details."""
    db = get_supabase()
    
    result = db.table("users").select("*").eq("id", user_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = result.data[0]
    # Remove sensitive data
    user.pop("password_hash", None)
    user.pop("claude_api_key", None)
    
    return user


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Delete a user."""
    db = get_supabase()
    
    if user_id == admin_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    db.table("users").delete().eq("id", user_id).execute()
    
    return {"status": "success", "message": f"User {user_id} deleted"}


# =============================================================================
# System Configuration Routes
# =============================================================================

@router.get("/config")
async def get_config(admin_id: str = Depends(verify_admin)):
    """Get system configuration (non-sensitive)."""
    return {
        "admin_emails": get_admin_emails(),
        "training_types": [t.value for t in TrainingType],
        "default_category": "afl",
    }


@router.post("/config/add-admin-email")
async def add_admin_email(
    email: str,
    admin_id: str = Depends(verify_admin),
):
    """
    Add an email to the admin list permanently.
    
    This adds the email to the database by setting is_admin=True for the user.
    For config-based admin emails, update ADMIN_EMAILS environment variable.
    """
    db = get_supabase()
    
    # Find user by email
    result = db.table("users").select("id, email, is_admin").eq("email", email).execute()
    
    if not result.data:
        return {"status": "not_found", "message": f"No user found with email {email}"}
    
    user = result.data[0]
    
    if user.get("is_admin"):
        return {"status": "exists", "message": f"{email} is already an admin"}
    
    # Make them admin
    db.table("users").update({"is_admin": True}).eq("id", user["id"]).execute()
    
    return {"status": "success", "message": f"Added {email} as admin"}


# =============================================================================
# Feedback Review Routes (Admin Only)
# =============================================================================

@router.get("/feedback")
async def list_all_feedback(
    status: Optional[str] = None,
    feedback_type: Optional[str] = None,
    limit: int = 100,
    admin_id: str = Depends(verify_admin),
):
    """List all user feedback for review."""
    db = get_supabase()
    
    query = db.table("user_feedback").select(
        "id, user_id, feedback_type, feedback_text, rating, status, created_at, original_prompt"
    )
    
    if status:
        query = query.eq("status", status)
    if feedback_type:
        query = query.eq("feedback_type", feedback_type)
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    
    return {"count": len(result.data), "feedback": result.data}


@router.get("/feedback/{feedback_id}")
async def get_feedback_details(
    feedback_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Get detailed feedback for review."""
    db = get_supabase()
    
    result = db.table("user_feedback").select("*").eq("id", feedback_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    return result.data[0]


class FeedbackReview(BaseModel):
    """Model for reviewing feedback."""
    status: str  # reviewed, implemented, rejected
    admin_notes: Optional[str] = None
    create_training: bool = False  # Whether to create training data from this


@router.post("/feedback/{feedback_id}/review")
async def review_feedback(
    feedback_id: str,
    review: FeedbackReview,
    admin_id: str = Depends(verify_admin),
):
    """
    Review and process user feedback.
    
    Can optionally create training data from the feedback.
    """
    db = get_supabase()
    training_manager = get_training_manager()
    
    # Get feedback
    feedback_result = db.table("user_feedback").select("*").eq("id", feedback_id).execute()
    
    if not feedback_result.data:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    feedback = feedback_result.data[0]
    
    # Update feedback status
    db.table("user_feedback").update({
        "status": review.status,
        "admin_notes": review.admin_notes,
        "reviewed_by": admin_id,
        "reviewed_at": "now()",
    }).eq("id", feedback_id).execute()
    
    # Create training data if requested and feedback is a correction
    training_result = None
    if review.create_training and feedback.get("correct_code") and feedback.get("feedback_type") == "correction":
        training_result = training_manager.add_correction_from_feedback(
            original_prompt=feedback["original_prompt"],
            wrong_output=feedback["generated_code"],
            correct_output=feedback["correct_code"],
            feedback=feedback["feedback_text"],
            created_by=admin_id,
        )
    
    return {
        "status": "success",
        "feedback_updated": True,
        "training_created": training_result is not None,
        "training_data": training_result,
    }


# =============================================================================
# Training Suggestions Review Routes (Admin Only)
# =============================================================================

@router.get("/suggestions")
async def list_training_suggestions(
    status: Optional[str] = "pending",
    limit: int = 100,
    admin_id: str = Depends(verify_admin),
):
    """List training suggestions from users."""
    db = get_supabase()
    
    query = db.table("training_suggestions").select(
        "id, user_id, title, training_type, category, status, created_at"
    )
    
    if status:
        query = query.eq("status", status)
    
    result = query.order("created_at", desc=True).limit(limit).execute()
    
    return {"count": len(result.data), "suggestions": result.data}


@router.get("/suggestions/{suggestion_id}")
async def get_suggestion_details(
    suggestion_id: str,
    admin_id: str = Depends(verify_admin),
):
    """Get detailed suggestion for review."""
    db = get_supabase()
    
    result = db.table("training_suggestions").select("*").eq("id", suggestion_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    return result.data[0]


class SuggestionReview(BaseModel):
    """Model for reviewing suggestions."""
    status: str  # approved, rejected, implemented
    admin_notes: Optional[str] = None
    priority: Optional[int] = None  # Override priority if approving


@router.post("/suggestions/{suggestion_id}/review")
async def review_suggestion(
    suggestion_id: str,
    review: SuggestionReview,
    admin_id: str = Depends(verify_admin),
):
    """
    Review and process training suggestion.
    
    If approved, creates actual training data from the suggestion.
    """
    db = get_supabase()
    training_manager = get_training_manager()
    
    # Get suggestion
    suggestion_result = db.table("training_suggestions").select("*").eq("id", suggestion_id).execute()
    
    if not suggestion_result.data:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion = suggestion_result.data[0]
    
    # If approved, create training data
    training_data_id = None
    if review.status == "approved":
        training_result = training_manager.add_training_example(
            training_type=suggestion["training_type"],
            title=suggestion["title"],
            input_prompt=suggestion["input_prompt"],
            expected_output=suggestion["expected_output"],
            explanation=suggestion.get("explanation", ""),
            category=suggestion.get("category", "afl"),
            tags=suggestion.get("tags", []),
            priority=review.priority or suggestion.get("priority", 5),
            created_by=admin_id,
        )
        
        if training_result.get("status") == "success":
            training_data_id = training_result["data"]["id"]
    
    # Update suggestion
    db.table("training_suggestions").update({
        "status": review.status,
        "admin_notes": review.admin_notes,
        "reviewed_by": admin_id,
        "reviewed_at": "now()",
        "training_data_id": training_data_id,
    }).eq("id", suggestion_id).execute()
    
    return {
        "status": "success",
        "suggestion_updated": True,
        "training_created": training_data_id is not None,
        "training_data_id": training_data_id,
    }


@router.post("/suggestions/{suggestion_id}/approve")
async def quick_approve_suggestion(
    suggestion_id: str,
    priority: int = 5,
    admin_id: str = Depends(verify_admin),
):
    """Quick approve - creates training data immediately."""
    return await review_suggestion(
        suggestion_id,
        SuggestionReview(status="approved", priority=priority),
        admin_id
    )


@router.post("/suggestions/{suggestion_id}/reject")
async def quick_reject_suggestion(
    suggestion_id: str,
    reason: Optional[str] = None,
    admin_id: str = Depends(verify_admin),
):
    """Quick reject with optional reason."""
    return await review_suggestion(
        suggestion_id,
        SuggestionReview(status="rejected", admin_notes=reason),
        admin_id
    )


# =============================================================================
# Analytics Routes (Admin Only)
# =============================================================================

@router.get("/analytics/overview")
async def get_analytics_overview(
    days: int = 30,
    admin_id: str = Depends(verify_admin),
):
    """Get comprehensive analytics overview."""
    db = get_supabase()
    training_manager = get_training_manager()
    
    try:
        # User stats
        total_users = db.table("users").select("id", count="exact").execute()
        
        # Code generation stats
        total_codes = db.table("afl_codes").select("id", count="exact").execute()
        
        # Feedback stats
        feedback_stats = db.table("user_feedback").select("feedback_type, rating").execute()
        
        # Calculate metrics
        ratings = [f.get("rating") for f in feedback_stats.data if f.get("rating")]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        corrections = len([f for f in feedback_stats.data if f.get("feedback_type") == "correction"])
        praise = len([f for f in feedback_stats.data if f.get("feedback_type") == "praise"])
        
        # Training stats
        training_stats = training_manager.get_training_stats()
        
        # Pending reviews
        pending_feedback = db.table("user_feedback").select("id", count="exact").eq("status", "pending_review").execute()
        pending_suggestions = db.table("training_suggestions").select("id", count="exact").eq("status", "pending").execute()
        
        return {
            "users": {
                "total": total_users.count or 0,
            },
            "code_generation": {
                "total_codes": total_codes.count or 0,
            },
            "feedback": {
                "total": len(feedback_stats.data),
                "average_rating": round(avg_rating, 2),
                "corrections": corrections,
                "praise": praise,
                "pending_review": pending_feedback.count or 0,
            },
            "training": {
                "total_examples": training_stats.get("total", 0),
                "active_examples": training_stats.get("active", 0),
                "by_type": training_stats.get("by_type", {}),
                "pending_suggestions": pending_suggestions.count or 0,
            },
        }
        
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/trends")
async def get_analytics_trends(
    days: int = 30,
    admin_id: str = Depends(verify_admin),
):
    """Get usage trends over time."""
    db = get_supabase()
    
    try:
        # This would require more complex SQL queries
        # For now, return basic trend data
        
        return {
            "period_days": days,
            "message": "Detailed trend analytics coming soon",
            "note": "Use the analytics_events table to track detailed usage patterns",
        }
        
    except Exception as e:
        logger.error(f"Error getting trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))