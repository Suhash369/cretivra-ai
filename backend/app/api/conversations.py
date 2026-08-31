from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import UserDB
from app.api.auth import get_optional_user
from app.services.conversation_service import conversation_service
from app.schemas.conversation import ConversationCreate, ConversationUpdate, ConversationSchema

router = APIRouter(prefix="/conversations", tags=["Conversations"])

def verify_conversation_access(conv, current_user: Optional[UserDB]):
    """
    Ensures that a user can only access conversations belonging to their user_id
    or unassigned guest conversations when not logged in.
    """
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conv.user_id:
        if not current_user or current_user.id != conv.user_id:
            raise HTTPException(status_code=403, detail="Access denied to this conversation.")

@router.get("")
def list_conversations(
    q: Optional[str] = Query(None, description="Search query across titles and messages"),
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Fetch all conversations and search history isolated exclusively to the authenticated user.
    """
    user_id = current_user.id if current_user else None
    return conversation_service.list_conversations(db, search_query=q, user_id=user_id)

@router.post("", response_model=ConversationSchema, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Creates a new conversation associated with the authenticated user ID.
    """
    user_id = current_user.id if current_user else None
    return conversation_service.create_conversation(
        db=db,
        title=payload.title or "New Conversation",
        model_id=payload.model_id or "cretivra-1",
        user_id=user_id
    )

@router.get("/{conversation_id}", response_model=ConversationSchema)
def get_conversation(
    conversation_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    conv = conversation_service.get_conversation(db, conversation_id)
    verify_conversation_access(conv, current_user)
    return conv

@router.patch("/{conversation_id}", response_model=ConversationSchema)
def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    conv = conversation_service.get_conversation(db, conversation_id)
    verify_conversation_access(conv, current_user)
    
    updated_conv = conversation_service.update_conversation(
        db=db,
        conversation_id=conversation_id,
        title=payload.title,
        model_id=payload.model_id
    )
    return updated_conv

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    conv = conversation_service.get_conversation(db, conversation_id)
    verify_conversation_access(conv, current_user)
    
    deleted = conversation_service.delete_conversation(db, conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return None

@router.get("/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    conv = conversation_service.get_conversation(db, conversation_id)
    verify_conversation_access(conv, current_user)
    
    return [
        {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "role": m.role,
            "content": m.content,
            "reasoning_status": m.reasoning_status,
            "created_at": m.created_at.isoformat() if m.created_at else None
        } for m in conv.messages
    ]
