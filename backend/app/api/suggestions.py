from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.database.database import get_db
from app.database.models import SuggestionDB, UserDB
from app.api.auth import get_optional_user
from app.core.logging import logger

router = APIRouter(prefix="/suggestions", tags=["suggestions"])

class SuggestionCreate(BaseModel):
    category: str = Field(default="suggestion", description="Category: suggestion, feature, bug, comment")
    comment: str = Field(..., min_length=2, max_length=2500, description="User suggestion or comment")
    rating: Optional[int] = Field(default=None, ge=1, le=5, description="1 to 5 star rating or sentiment")
    user_email: Optional[str] = Field(default=None, max_length=255)
    user_name: Optional[str] = Field(default=None, max_length=255)
    page_url: Optional[str] = Field(default=None, max_length=500)
    device_info: Optional[str] = Field(default=None, max_length=500)

class SuggestionResponse(BaseModel):
    success: bool
    id: str
    message: str
    created_at: str

@router.post("", response_model=SuggestionResponse, status_code=status.HTTP_201_CREATED)
def submit_suggestion(
    payload: SuggestionCreate,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Submits a user comment or suggestion, saving it directly to the Supabase database.
    Can be used by authenticated users or anonymous visitors.
    """
    user_id = current_user.id if current_user else None
    user_email = (current_user.email if current_user else None) or payload.user_email
    user_name = (current_user.full_name or current_user.username if current_user else None) or payload.user_name

    cleaned_comment = payload.comment.strip()
    if not cleaned_comment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Suggestion comment cannot be empty."
        )

    try:
        new_suggestion = SuggestionDB(
            user_id=user_id,
            user_email=user_email,
            user_name=user_name,
            category=payload.category.lower().strip() or "suggestion",
            comment=cleaned_comment,
            rating=payload.rating,
            page_url=payload.page_url,
            device_info=payload.device_info,
            status="pending"
        )
        db.add(new_suggestion)
        db.commit()
        db.refresh(new_suggestion)

        logger.info(
            f"Saved suggestion [{new_suggestion.id}] category='{new_suggestion.category}' "
            f"from user='{user_email or 'anonymous'}'"
        )

        return SuggestionResponse(
            success=True,
            id=new_suggestion.id,
            message="Thank you! Your feedback has been saved to Supabase and reviewed by the Asura AI by Cretivra team.",
            created_at=new_suggestion.created_at.isoformat() if new_suggestion.created_at else datetime.utcnow().isoformat()
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving suggestion to database: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save suggestion. Please try again."
        )

@router.get("")
def list_suggestions(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Fetches recent suggestions count and public feedback entries.
    """
    total = db.query(SuggestionDB).count()
    items = (
        db.query(SuggestionDB)
        .order_by(SuggestionDB.created_at.desc())
        .limit(min(limit, 50))
        .all()
    )

    return {
        "total": total,
        "suggestions": [
            {
                "id": s.id,
                "category": s.category,
                "comment": s.comment,
                "rating": s.rating,
                "user_name": s.user_name or "Anonymous",
                "status": s.status,
                "created_at": s.created_at.isoformat() if s.created_at else None
            }
            for s in items
        ]
    }
