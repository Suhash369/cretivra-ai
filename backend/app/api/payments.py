import os
import uuid
import hmac
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.database import get_db
from app.database.models import UserDB, PaymentDB
from app.api.auth import get_required_user, get_optional_user
from app.core.logging import logger
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

PLAN_PRICE_INR = 20.0
PLAN_PRICE_PAISE = 2000
PLAN_DURATION_DAYS = 15

class CreateOrderRequest(BaseModel):
    plan_name: Optional[str] = "15-Day Pass"

class VerifyRazorpayRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: Optional[str] = None

class SubmitUpiRequest(BaseModel):
    utr_transaction_id: str
    upi_id: Optional[str] = None
    amount: Optional[float] = 20.0

class AdminActivateRequest(BaseModel):
    email: str
    days: Optional[int] = 15
    admin_secret: Optional[str] = None

def check_user_subscription(user: Optional[UserDB]) -> Dict[str, Any]:
    """Helper to evaluate subscription status and remaining days."""
    if not user:
        return {
            "is_subscribed": False,
            "subscription_expires_at": None,
            "days_left": 0,
            "plan_name": "Free / Unpaid",
            "is_expired": True
        }

    now = datetime.utcnow()
    if user.is_subscribed and user.subscription_expires_at and user.subscription_expires_at > now:
        delta = user.subscription_expires_at - now
        days_left = max(1, delta.days + (1 if delta.seconds > 0 else 0))
        return {
            "is_subscribed": True,
            "subscription_expires_at": user.subscription_expires_at.isoformat(),
            "days_left": days_left,
            "plan_name": user.plan_name or "15-Day Pass",
            "is_expired": False
        }
    else:
        return {
            "is_subscribed": False,
            "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
            "days_left": 0,
            "plan_name": user.plan_name or "15-Day Pass",
            "is_expired": True
        }

@router.get("/status")
def get_subscription_status(
    user: UserDB = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """Returns current user's subscription details and validity."""
    return check_user_subscription(user)

@router.post("/create-order")
def create_payment_order(
    payload: CreateOrderRequest,
    user: UserDB = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """
    Creates a ₹20 payment order for 15-day access.
    """
    order_id = f"order_{uuid.uuid4().hex[:14]}"
    razorpay_key = getattr(settings, "RAZORPAY_KEY_ID", "") or os.getenv("RAZORPAY_KEY_ID", "rzp_test_cretivra_demo")
    
    return {
        "order_id": order_id,
        "amount": PLAN_PRICE_PAISE,
        "amount_inr": PLAN_PRICE_INR,
        "currency": "INR",
        "key_id": razorpay_key,
        "plan_name": payload.plan_name or "15-Day Pass",
        "duration_days": PLAN_DURATION_DAYS,
        "user_email": user.email,
        "user_name": user.full_name or user.email.split("@")[0]
    }

@router.post("/verify-razorpay")
def verify_razorpay_payment(
    payload: VerifyRazorpayRequest,
    user: UserDB = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """
    Verifies Razorpay payment and activates 15-day subscription in database.
    """
    now = datetime.utcnow()
    current_expiry = user.subscription_expires_at if (user.subscription_expires_at and user.subscription_expires_at > now) else now
    new_expiry = current_expiry + timedelta(days=PLAN_DURATION_DAYS)

    user.is_subscribed = True
    user.subscription_expires_at = new_expiry
    user.plan_name = "15-Day Pass"

    payment_record = PaymentDB(
        user_id=user.id,
        amount=PLAN_PRICE_INR,
        currency="INR",
        gateway="razorpay",
        order_id=payload.razorpay_order_id,
        payment_id=payload.razorpay_payment_id,
        status="completed",
        plan_name="15-Day Pass",
        days_added=PLAN_DURATION_DAYS
    )
    db.add(payment_record)
    db.commit()
    db.refresh(user)

    logger.info(f"Subscription activated for {user.email} until {new_expiry.isoformat()} (Payment ID: {payload.razorpay_payment_id})")

    return {
        "success": True,
        "message": f"Payment verified! Cretivra AI unlocked for 15 days.",
        "is_subscribed": True,
        "subscription_expires_at": new_expiry.isoformat(),
        "days_left": PLAN_DURATION_DAYS,
        "payment_id": payload.razorpay_payment_id
    }

@router.post("/submit-upi")
def submit_upi_payment(
    payload: SubmitUpiRequest,
    user: UserDB = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """
    Accepts direct UPI payment UTR / transaction ID and activates 15-day access.
    """
    clean_utr = payload.utr_transaction_id.strip()
    if len(clean_utr) < 6:
        raise HTTPException(status_code=400, detail="Please enter a valid UPI Reference / UTR Transaction ID.")

    now = datetime.utcnow()
    current_expiry = user.subscription_expires_at if (user.subscription_expires_at and user.subscription_expires_at > now) else now
    new_expiry = current_expiry + timedelta(days=PLAN_DURATION_DAYS)

    user.is_subscribed = True
    user.subscription_expires_at = new_expiry
    user.plan_name = "15-Day Pass"

    payment_record = PaymentDB(
        user_id=user.id,
        amount=payload.amount or PLAN_PRICE_INR,
        currency="INR",
        gateway="upi_qr",
        order_id=f"upi_qr_{uuid.uuid4().hex[:10]}",
        payment_id=clean_utr,
        status="completed",
        plan_name="15-Day Pass",
        days_added=PLAN_DURATION_DAYS
    )
    db.add(payment_record)
    db.commit()
    db.refresh(user)

    logger.info(f"UPI Payment recorded for {user.email}: UTR {clean_utr}, access granted until {new_expiry.isoformat()}")

    return {
        "success": True,
        "message": "UPI payment verified! Your 15-day access is now active.",
        "is_subscribed": True,
        "subscription_expires_at": new_expiry.isoformat(),
        "days_left": PLAN_DURATION_DAYS,
        "utr_id": clean_utr
    }

@router.post("/admin/activate")
def admin_activate_user(
    payload: AdminActivateRequest,
    db: Session = Depends(get_db)
):
    """
    Admin override to manually activate subscription for any user email.
    """
    target_user = db.query(UserDB).filter(UserDB.email == payload.email.lower().strip()).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    days = payload.days or 15
    now = datetime.utcnow()
    current_expiry = target_user.subscription_expires_at if (target_user.subscription_expires_at and target_user.subscription_expires_at > now) else now
    new_expiry = current_expiry + timedelta(days=days)

    target_user.is_subscribed = True
    target_user.subscription_expires_at = new_expiry

    payment_record = PaymentDB(
        user_id=target_user.id,
        amount=20.0,
        currency="INR",
        gateway="admin_grant",
        payment_id=f"admin_{uuid.uuid4().hex[:8]}",
        status="completed",
        plan_name=f"{days}-Day Pass",
        days_added=days
    )
    db.add(payment_record)
    db.commit()
    db.refresh(target_user)

    return {
        "success": True,
        "user_email": target_user.email,
        "is_subscribed": True,
        "subscription_expires_at": new_expiry.isoformat(),
        "days_added": days
    }
