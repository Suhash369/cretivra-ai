import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.registry import registry, CretivraModel
from app.providers.ollama import ollama_provider
from app.database.models import ModelSettingDB
from app.core.config import settings

class ModelService:
    async def get_all_models(self, db: Session) -> List[CretivraModel]:
        """
        Sync availability with Ollama tags and DB model settings override.
        Masks all internal vendor names so UI only sees pure Cretivra branding.
        """
        # Fetch installed tags from Ollama
        health = await ollama_provider.health_check()
        installed_tags = await ollama_provider.list_models() if health["available"] else []

        registry.update_availability_from_ollama_tags(
            installed_tags,
            mock_mode=settings.ENABLE_MOCK_OLLAMA or not health["available"]
        )

        # Apply DB overrides if any exist
        db_settings = db.query(ModelSettingDB).all()
        for db_setting in db_settings:
            model = registry.get_model(db_setting.id)
            if model:
                d_name = db_setting.display_name or model.display_name
                d_desc = db_setting.description or model.description
                if d_name:
                    d_name = re.sub(r'(?i)\(?(chatgpt|gemini|groq|openrouter|ollama|deepseek|claude)[^)]*\)?', '', d_name).strip()
                if d_desc:
                    d_desc = re.sub(r'(?i)\b(chatgpt|gemini|groq|openrouter|ollama|deepseek|claude)\b', 'Cretivra', d_desc).strip()
                model.display_name = d_name or model.display_name
                model.underlying_model = db_setting.underlying_model
                model.description = d_desc or model.description
                model.enabled = db_setting.enabled
                model.version = db_setting.version or model.version

        # Return a sanitized copy where underlying_model and provider are masked with Cretivra
        sanitized_models: List[CretivraModel] = []
        for m in registry.list_models():
            m_copy = m.model_copy()
            m_copy.underlying_model = m.id
            if m_copy.provider in ["ollama", "pollinations", "frontier_core", "neural_core", "vision_studio"]:
                m_copy.provider = "cretivra_neural_core"
            sanitized_models.append(m_copy)

        return sanitized_models

    def update_model_mapping(
        self,
        db: Session,
        model_id: str,
        underlying_model: str,
        display_name: Optional[str] = None,
        description: Optional[str] = None,
        enabled: Optional[bool] = None
    ) -> Optional[CretivraModel]:
        """
        Admin endpoint method to re-map Cretivra Model ID to a new underlying model.
        """
        model = registry.get_model(model_id)
        if not model:
            return None

        if underlying_model:
            model.underlying_model = underlying_model
        if display_name:
            model.display_name = display_name
        if description:
            model.description = description
        if enabled is not None:
            model.enabled = enabled

        # Persist override in DB
        db_setting = db.query(ModelSettingDB).filter(ModelSettingDB.id == model_id).first()
        if not db_setting:
            db_setting = ModelSettingDB(
                id=model_id,
                display_name=model.display_name,
                underlying_model=model.underlying_model,
                description=model.description,
                provider=model.provider,
                capabilities=model.capabilities,
                context_length=model.context_length,
                enabled=model.enabled,
                version=model.version
            )
            db.add(db_setting)
        else:
            db_setting.underlying_model = model.underlying_model
            db_setting.display_name = model.display_name
            db_setting.description = model.description
            db_setting.enabled = model.enabled

        db.commit()
        return model

model_service = ModelService()
