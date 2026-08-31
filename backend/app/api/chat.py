from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import UserDB
from app.api.auth import get_optional_user
from app.services.chat_service import chat_service
from app.services.conversation_service import conversation_service
from app.schemas.chat import ChatRequest, EditMessageRequest
from app.core.logging import logger

router = APIRouter(prefix="", tags=["Chat"])

@router.post("/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Streaming SSE chat endpoint supporting per-user conversation isolation.
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    # Create conversation if id not provided
    conversation_id = payload.conversation_id
    if not conversation_id:
        user_id = current_user.id if current_user else None
        conv = conversation_service.create_conversation(
            db=db,
            title="New Conversation",
            model_id=payload.model_id,
            user_id=user_id
        )
        conversation_id = conv.id
    else:
        # Verify access if existing conversation has a user_id
        conv = conversation_service.get_conversation(db, conversation_id)
        if conv and conv.user_id and (not current_user or current_user.id != conv.user_id):
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
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message content cannot be empty.")

    try:
        result = conversation_service.edit_message(db, message_id, payload.message.strip())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    conv_id = result["conversation_id"]
    conv = conversation_service.get_conversation(db, conv_id)
    if conv and conv.user_id and (not current_user or current_user.id != conv.user_id):
        raise HTTPException(status_code=403, detail="Access denied to this conversation.")

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
    """
    try:
        result = conversation_service.prepare_regeneration(db, message_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    conv_id = result["conversation_id"]
    conv = conversation_service.get_conversation(db, conv_id)
    if conv and conv.user_id and (not current_user or current_user.id != conv.user_id):
        raise HTTPException(status_code=403, detail="Access denied to this conversation.")

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
