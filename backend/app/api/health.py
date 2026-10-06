from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.database import get_db
from app.core.config import settings
from app.core.model_manager import model_manager
from app.providers.tavily import tavily_provider
from app.providers.image_search import image_search_provider
from app.providers.image_generation import image_generation_provider
from app.providers.speech_to_text import stt_provider
from app.providers.text_to_speech import tts_provider

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def get_health_status(request: Request, db: Session = Depends(get_db)):
    is_dev = request.headers.get("X-Dev-Mode") == "true" or request.query_params.get("dev") == "true"

    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    web_search_active = settings.WEB_SEARCH_ENABLED and tavily_provider.is_available()
    image_search_active = settings.IMAGE_SEARCH_ENABLED
    image_gen_active = settings.IMAGE_GENERATION_ENABLED
    voice_active = settings.VOICE_ENABLED and (stt_provider.enabled or tts_provider.enabled)
    vision_active = True

    response_data = {
        "status": "ok" if db_connected else "degraded",
        "asura": True,
        "web_search": web_search_active,
        "image_search": image_search_active,
        "image_generation": image_gen_active,
        "voice": voice_active,
        "vision": vision_active,
        # Backward compatibility fields for legacy status bars
        "backend": {
            "status": "connected",
            "name": "Cretivra Asura",
            "version": "2.0.0"
        },
        "database": {
            "status": "connected" if db_connected else "disconnected"
        }
    }

    if is_dev:
        provider_status = await model_manager.check_provider_availability()
        response_data["developer_diagnostics"] = {
            "providers": provider_status,
            "database_connected": db_connected
        }

    return response_data
