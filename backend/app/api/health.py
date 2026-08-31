from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.database import get_db
from app.providers.ollama import ollama_provider
from app.services.model_service import model_service
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def get_health_status(db: Session = Depends(get_db)):
    # Check Database connection
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    # Check Ollama connection
    ollama_health = await ollama_provider.health_check()
    
    # Get available models
    models = await model_service.get_all_models(db)
    available_models_count = len([m for m in models if m.is_available])

    overall_status = "healthy" if db_status == "connected" and (ollama_health["available"] or settings.ENABLE_MOCK_OLLAMA) else "degraded"

    return {
        "status": overall_status,
        "backend": {
            "status": "connected",
            "name": settings.PROJECT_NAME,
            "version": "1.0.0"
        },
        "ollama": {
            "status": ollama_health["status"],
            "url": ollama_health["url"],
            "installed_models_count": ollama_health["installed_models_count"],
            "mock_mode": settings.ENABLE_MOCK_OLLAMA
        },
        "database": {
            "status": db_status
        },
        "models": {
            "total_registered": len(models),
            "available_count": available_models_count
        }
    }
