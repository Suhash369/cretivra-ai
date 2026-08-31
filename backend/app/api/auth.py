from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from app.database.database import get_db
from app.database.models import UserDB
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.logging import logger

router = APIRouter()

class RegisterSchema(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class LoginSchema(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[UserDB]:
    """
    Extracts the authenticated user from the Authorization header if provided.
    Returns None if no token or invalid token (guest mode).
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split(" ")[1].strip()
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        return None

    user = db.query(UserDB).filter(UserDB.id == payload.get("sub")).first()
    return user

def get_required_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> UserDB:
    """
    Strictly requires a valid authenticated user JWT token.
    """
    user = get_optional_user(authorization, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in or register."
        )
    return user

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterSchema, db: Session = Depends(get_db)):
    """Register new user account in database."""
    email_clean = payload.email.lower().strip()
    
    if not email_clean or "@" not in email_clean:
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")

    existing = db.query(UserDB).filter(UserDB.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    if len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    new_user = UserDB(
        email=email_clean,
        username=email_clean.split("@")[0],
        password_hash=hash_password(payload.password),
        full_name=payload.full_name or email_clean.split("@")[0].title()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"New user registered: {new_user.email} (ID: {new_user.id})")
    
    token = create_access_token(new_user.id, new_user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None
        }
    }

@router.post("/login", response_model=AuthResponse)
def login_user(payload: LoginSchema, db: Session = Depends(get_db)):
    """Authenticate user login against stored hash."""
    email_clean = payload.email.lower().strip()
    user = db.query(UserDB).filter(UserDB.email == email_clean).first()
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    logger.info(f"User logged in: {user.email}")
    token = create_access_token(user.id, user.email)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    }

@router.get("/me")
def get_current_user_profile(user: UserDB = Depends(get_required_user)):
    """Fetch profile for current authenticated token."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }
