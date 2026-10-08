import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import UserDB
from app.api.auth import get_optional_user
from app.services.conversation_service import conversation_service
from app.services.voice_service import voice_service
from app.core.logging import logger

router = APIRouter(prefix="/voice", tags=["Voice"])

class VoiceChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    voice: Optional[str] = "Breeze"
    voice_model: Optional[str] = "cretivra-neural"
    history: Optional[List[Dict[str, str]]] = None

class VoiceSynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = "Breeze"

@router.post("/stream")
async def voice_stream(
    payload: VoiceChatRequest,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Ultra-fast real-time streaming voice endpoint with sentence-boundary chunking.
    Delivers the first spoken sentence in <400ms for immediate client audio playback
    while streaming the remaining response in the background.
    """
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Voice message cannot be empty.")

    # 1. Resolve or create conversation
    conv_id = payload.conversation_id
    user_id = current_user.id if current_user else None

    if not conv_id:
        conv = conversation_service.create_conversation(
            db=db,
            title="Voice Conversation",
            model_id="asura-voice",
            user_id=user_id
        )
        conv_id = conv.id
    else:
        conv = conversation_service.get_conversation(db, conv_id)
        if not conv:
            conv = conversation_service.create_conversation(
                db=db,
                title="Voice Conversation",
                model_id="asura-voice",
                user_id=user_id
            )
            conv_id = conv.id

    # Record user message in DB
    conversation_service.add_message(
        db=db,
        conversation_id=conv_id,
        role="user",
        content=text
    )

    async def stream_generator():
        yield f"data: {json.dumps({'type': 'start', 'conversation_id': conv_id})}\n\n"
        full_text = ""
        async for chunk in voice_service.stream_voice_reply(
            message=text,
            history=payload.history,
            voice_persona=payload.voice,
            voice_model=payload.voice_model
        ):
            if chunk.get("type") == "sentence":
                yield f"data: {json.dumps(chunk)}\n\n"
            elif chunk.get("type") == "done":
                full_text = chunk.get("full_text", "")
                yield f"data: {json.dumps({'type': 'done', 'full_text': full_text, 'conversation_id': conv_id})}\n\n"

        if full_text:
            try:
                conversation_service.add_message(
                    db=db,
                    conversation_id=conv_id,
                    role="assistant",
                    content=full_text
                )
            except Exception as e:
                logger.warning(f"Could not persist voice reply message: {e}")

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/chat")
async def voice_chat(
    payload: VoiceChatRequest,
    current_user: Optional[UserDB] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Two-way conversational voice endpoint powered by Gemini.
    Generates an articulate, spoken-word conversational response and native audio WAV speech.
    Persists to database so user conversation history remains unified.
    """
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Voice message cannot be empty.")

    # 1. Resolve or create conversation
    conv_id = payload.conversation_id
    user_id = current_user.id if current_user else None

    if not conv_id:
        conv = conversation_service.create_conversation(
            db=db,
            title="Voice Conversation",
            model_id="cretivra-voice",
            user_id=user_id
        )
        conv_id = conv.id
    else:
        conv = conversation_service.get_conversation(db, conv_id)
        if not conv:
            conv = conversation_service.create_conversation(
                db=db,
                title="Voice Conversation",
                model_id="cretivra-voice",
                user_id=user_id
            )
            conv_id = conv.id

    # 2. Record user message in DB
    conversation_service.add_message(
        db=db,
        conversation_id=conv_id,
        role="user",
        content=text
    )

    # 3. Generate natural spoken answer via Cretivra Multi-Provider Voice Engine
    spoken_reply = await voice_service.generate_voice_reply(
        message=text,
        history=payload.history,
        voice_persona=payload.voice,
        voice_model=payload.voice_model
    )

    # 4. Synthesize speech audio via Voice TTS if available
    audio_data_url = await voice_service.synthesize_speech(
        text=spoken_reply,
        voice=payload.voice
    )

    # 5. Record assistant response in DB
    assistant_msg = conversation_service.add_message(
        db=db,
        conversation_id=conv_id,
        role="assistant",
        content=spoken_reply
    )

    return {
        "text": spoken_reply,
        "audio_url": audio_data_url,
        "conversation_id": conv_id,
        "message_id": assistant_msg.id,
        "model": payload.voice_model or "cretivra-neural"
    }

@router.post("/synthesize")
@router.post("/tts")
async def synthesize_voice(payload: VoiceSynthesizeRequest):
    """
    Text-to-speech synthesis using Gemini Flash TTS.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    audio_url = await voice_service.synthesize_speech(
        text=payload.text.strip(),
        voice=payload.voice
    )
    return {
        "audio_url": audio_url,
        "text": payload.text.strip()
    }

@router.post("/transcribe")
@router.post("/stt")
async def transcribe_audio_file(
    file: UploadFile = File(...)
):
    """
    Speech-to-text audio transcription using Gemini multimodal audio perception.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded audio file is empty.")

    mime = file.content_type or "audio/webm"
    transcription = await voice_service.transcribe_audio(contents, mime_type=mime)
    return {
        "text": transcription
    }
