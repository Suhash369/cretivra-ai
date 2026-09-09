from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import UserDB, MessageDB
from app.api.auth import get_optional_user, get_required_user
from app.services.chat_service import chat_service
from app.services.conversation_service import conversation_service
from app.schemas.chat import ChatRequest, EditMessageRequest
from app.core.logging import logger

router = APIRouter(prefix="", tags=["Chat"])

@router.post("/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    current_user: UserDB = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """
    Streaming SSE chat endpoint supporting per-user conversation isolation. Strictly authenticated.
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    # Create conversation if id not provided
    conversation_id = payload.conversation_id
    if not conversation_id:
        conv = conversation_service.create_conversation(
            db=db,
            title="New Conversation",
            model_id=payload.model_id,
            user_id=current_user.id
        )
        conversation_id = conv.id
    else:
        # Verify access if existing conversation has a user_id
        conv = conversation_service.get_conversation(db, conversation_id)
        if conv and conv.user_id and current_user.id != conv.user_id:
            raise HTTPException(status_code=403, detail="Access denied to this conversation.")

    # Save user message to database first
    conversation_service.add_message(
        db=db,
        conversation_id=conversation_id,
        role="user",
        content=payload.message.strip()
    )

    generator = chat_service.generate_response_stream(
        db=db,
        conversation_id=conversation_id,
        user_message_content=payload.message.strip(),
        model_id=payload.model_id,
        attachments=payload.attachments,
        system_prompt=payload.system_prompt
    )

    return StreamingResponse(generator, media_type="text/event-stream")

@router.patch("/messages/{message_id}")
async def edit_message(
    message_id: str,
    payload: EditMessageRequest,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Edits a user message, truncates later messages, and streams fresh assistant response.
    Validates ownership BEFORE mutating any database records.
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    # 1. Pre-validation and ownership check BEFORE mutation
    target_msg = db.query(MessageDB).filter(MessageDB.id == message_id).first()
    if not target_msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    conv = conversation_service.get_conversation(db, target_msg.conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if conv.user_id and (not current_user or current_user.id != conv.user_id):
        raise HTTPException(status_code=403, detail="Access denied to this conversation.")

    # 2. Safely mutate message now that authorization is verified
    result = conversation_service.edit_message(db, message_id, payload.message.strip())
    conv_id = result["conversation_id"]
    model_id = conv.model_id if conv else "cretivra-1"

    generator = chat_service.generate_response_stream(
        db=db,
        conversation_id=conv_id,
        user_message_content=payload.message.strip(),
        model_id=model_id
    )

    return StreamingResponse(generator, media_type="text/event-stream")

@router.post("/messages/{message_id}/regenerate")
async def regenerate_message(
    message_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Regenerates assistant response for a conversation starting after the preceding user prompt.
    Validates ownership BEFORE mutating any database records.
    """
    # 1. Pre-validation and ownership check BEFORE mutation
    target_msg = db.query(MessageDB).filter(MessageDB.id == message_id).first()
    if not target_msg:
        raise HTTPException(status_code=404, detail="Target message not found.")

    conv = conversation_service.get_conversation(db, target_msg.conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if conv.user_id and (not current_user or current_user.id != conv.user_id):
        raise HTTPException(status_code=403, detail="Access denied to this conversation.")

    # 2. Safely prepare regeneration now that authorization is verified
    result = conversation_service.prepare_regeneration(db, message_id)
    conv_id = result["conversation_id"]

    if not conv or not conv.messages:
        raise HTTPException(status_code=400, detail="No preceding user message to regenerate.")

    last_user_msg = None
    for m in reversed(conv.messages):
        if m.role == "user":
            last_user_msg = m
            break

    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message found to regenerate.")

    generator = chat_service.generate_response_stream(
        db=db,
        conversation_id=conv_id,
        user_message_content=last_user_msg.content,
        model_id=conv.model_id
    )

    return StreamingResponse(generator, media_type="text/event-stream")

@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Deletes an individual message from a conversation with ownership verification.
    """
    target_msg = db.query(MessageDB).filter(MessageDB.id == message_id).first()
    if not target_msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    conv = conversation_service.get_conversation(db, target_msg.conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if conv.user_id and (not current_user or current_user.id != conv.user_id):
        raise HTTPException(status_code=403, detail="Access denied to delete this message.")

    # If deleting a user question, also delete the subsequent assistant response
    if target_msg.role == "user":
        subsequent_assistant = db.query(MessageDB).filter(
            MessageDB.conversation_id == target_msg.conversation_id,
            MessageDB.role == "assistant",
            MessageDB.created_at >= target_msg.created_at
        ).order_by(MessageDB.created_at.asc()).first()
        if subsequent_assistant:
            db.delete(subsequent_assistant)

    db.delete(target_msg)
    db.commit()
    return None

