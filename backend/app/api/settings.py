from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import SystemSettingDB, ConversationDB, MessageDB, AttachmentDB
from app.schemas.settings import SystemSettingsSchema
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    db_settings = db.query(SystemSettingDB).all()
    setting_dict = {s.key: s.value for s in db_settings}

    return {
        "ollama_base_url": setting_dict.get("ollama_base_url", settings.OLLAMA_BASE_URL),
        "default_model": setting_dict.get("default_model", settings.DEFAULT_MODEL),
        "temperature": float(setting_dict.get("temperature", settings.TEMPERATURE)),
        "max_context_messages": int(setting_dict.get("max_context_messages", settings.MAX_CONTEXT_MESSAGES)),
        "max_output_tokens": int(setting_dict.get("max_output_tokens", settings.MAX_OUTPUT_TOKENS)),
        "system_prompt": setting_dict.get("system_prompt", settings.SYSTEM_PROMPT),
        "theme": setting_dict.get("theme", "dark"),
        "max_upload_size_mb": settings.MAX_UPLOAD_SIZE_MB
    }

@router.patch("")
def update_settings(payload: SystemSettingsSchema, db: Session = Depends(get_db)):
    updates = payload.dict(exclude_unset=True)
    for key, val in updates.items():
        if val is not None:
            db_item = db.query(SystemSettingDB).filter(SystemSettingDB.key == key).first()
            if not db_item:
                db_item = SystemSettingDB(key=key, value=str(val))
                db.add(db_item)
            else:
                db_item.value = str(val)
    db.commit()
    return get_settings(db)

@router.post("/clear-conversations")
def clear_all_conversations(db: Session = Depends(get_db)):
    db.query(AttachmentDB).delete()
    db.query(MessageDB).delete()
    db.query(ConversationDB).delete()
    db.commit()
    return {"message": "All conversations cleared successfully."}
