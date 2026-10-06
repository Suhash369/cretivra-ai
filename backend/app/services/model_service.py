import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.registry import registry, CretivraModel
from app.database.models import ModelSettingDB
from app.core.config import settings

class ModelService:
    async def get_all_models(self, db: Session) -> List[CretivraModel]:
        """
        Returns registered Asura models backed by Cretivra neural routing.
        Masks all internal vendor names so UI only sees pure Cretivra Asura branding.
        """
        # Apply DB overrides if any exist
        try:
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
        except Exception:
            pass

        # Return sanitized models where provider is pure Cretivra
        sanitized_models: List[CretivraModel] = []
        for m in registry.list_models():
            m_copy = m.model_copy()
            m_copy.underlying_model = m.id
            m_copy.provider = "cretivra_neural_core"
            m_copy.is_available = True
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
        Admin endpoint method to re-map Cretivra Model ID.
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
