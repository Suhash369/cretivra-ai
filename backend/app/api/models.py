from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.services.model_service import model_service
from app.schemas.model import ModelUpdateSchema
from app.models.registry import CretivraModel

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("", response_model=List[CretivraModel])
async def list_models(db: Session = Depends(get_db)):
    """
    Returns registered Cretivra models with mapped underlying names hidden from end-user UI.
    """
    return await model_service.get_all_models(db)

@router.patch("/{model_id}", response_model=CretivraModel)
async def update_model_mapping(
    model_id: str,
    payload: ModelUpdateSchema,
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to re-map Cretivra model to a different underlying model.
    """
    updated = model_service.update_model_mapping(
        db=db,
        model_id=model_id,
        underlying_model=payload.underlying_model,
        display_name=payload.display_name,
        description=payload.description,
        enabled=payload.enabled
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found in registry.")
    return updated
