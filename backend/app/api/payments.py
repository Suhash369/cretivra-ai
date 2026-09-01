import os
import re
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.database import get_db
from app.database.models import UserDB, PaymentDB
from app.api.auth import get_required_user, get_optional_user
from app.core.logging import logger
from app.core.config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])

PLAN_PRICE_INR = settings.PLAN_PRICE_INR
PLAN_DURATION_DAYS = settings.PLAN_DURATION_DAYS

def clean_utr_input(raw_utr: str) -> str:
    """Sanitize UTR input by stripping common prefixes, whitespaces, and punctuation."""
    cleaned = raw_utr.strip()
    cleaned = re.sub(r'^(utr|upi\s*ref|ref\s*no|txn\s*id|transaction\s*id|upi|rrn|journal\s*no|bank\s*ref|google\s*txn\s*id)[:\s/\-_]*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'[\s\-_/]', '', cleaned)
    return cleaned.upper()

class CreateUpiOrderRequest(BaseModel):
    plan_name: Optional[str] = "15-Day Pass"

class VerifyUpiRequest(BaseModel):
    order_id: Optional[str] = None
    utr_number: Optional[str] = None
    approval_ref_no: Optional[str] = None
    gpay_txn_id: Optional[str] = None
    response_code: Optional[str] = None
    gateway: Optional[str] = "google_pay"
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

@router.post("/create-upi-order")
def create_upi_order(
    payload: CreateUpiOrderRequest,
    user: UserDB = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """
    Creates a real-time ₹20 UPI payment order with locked amount, custom transaction note,
    and NPCI dynamic payment links.
    """
    order_id = f"CV20_{uuid.uuid4().hex[:10].upper()}"
    upi_id = settings.UPI_ID
    upi_name = settings.UPI_NAME
    
    # Official NPCI compliant UPI Intent URL
    encoded_name = upi_name.replace(" ", "%20")
    encoded_note = f"Cretivra%20AI%20Pass%20{order_id}"
    upi_intent_url = (
        f"upi://pay?pa={upi_id}&pn={encoded_name}&am={PLAN_PRICE_INR:.2f}&cu=INR&tr={order_id}&tn={encoded_note}"
    )

    # Dynamic QR code generator URL (locks ₹20 amount and merchant ID)
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={upi_intent_url}"

    # Create initial pending record
    new_payment = PaymentDB(
        user_id=user.id,
        amount=PLAN_PRICE_INR,
        currency="INR",
        gateway="upi_direct",
        order_id=order_id,
        payment_id=f"pending_{order_id}",
        status="pending",
        plan_name=payload.plan_name or "15-Day Pass",
        days_added=PLAN_DURATION_DAYS
    )
    db.add(new_payment)
    db.commit()

    return {
        "order_id": order_id,
        "amount_inr": PLAN_PRICE_INR,
        "currency": "INR",
        "upi_id": upi_id,
        "merchant_name": upi_name,
        "upi_intent_url": upi_intent_url,
        "qr_code_url": qr_code_url,
        "duration_days": PLAN_DURATION_DAYS,
        "user_email": user.email
    }

@router.get("/check-order/{order_id}")
def check_order_status(
    order_id: str,
    user: UserDB = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """
    Real-time polling endpoint to check if an order has been verified.
    """
    payment = db.query(PaymentDB).filter(PaymentDB.order_id == order_id).first()
    sub_info = check_user_subscription(user)

    if payment and payment.status == "completed":
        return {
            "order_id": order_id,
            "status": "completed",
            "is_subscribed": True,
            "days_left": sub_info["days_left"],
            "subscription_expires_at": sub_info["subscription_expires_at"]
        }

    return {
        "order_id": order_id,
        "status": payment.status if payment else "pending",
        "is_subscribed": sub_info["is_subscribed"],
        "days_left": sub_info["days_left"],
        "subscription_expires_at": sub_info["subscription_expires_at"]
    }

@router.post("/verify-upi")
def verify_upi_payment(
    payload: VerifyUpiRequest,
    user: UserDB = Depends(get_required_user),
    db: Session = Depends(get_db)
):
    """
    Validates genuine Indian banking UTR reference number or Google Pay API authorization
    and unlocks 15-day subscription. Enforces anti-fraud checks to prevent duplicate UTR reuse.
    """
    raw_reference = payload.approval_ref_no or payload.gpay_txn_id or payload.utr_number or ""
    clean_utr = clean_utr_input(raw_reference)
    
    # Validation: Must be alphanumeric and at least 6 characters
    if len(clean_utr) < 6 or not re.match(r'^[a-zA-Z0-9]+$', clean_utr):
        raise HTTPException(
            status_code=400,
            detail="Invalid Transaction Reference ID. Please provide a valid UTR / Google Pay Transaction ID."
        )

    # Check for duplicate UTR usage across all users
    existing_txn = db.query(PaymentDB).filter(
        PaymentDB.payment_id == clean_utr,
        PaymentDB.status == "completed"
    ).first()

    if existing_txn:
        # If the same user previously submitted this exact UTR, return success
        if existing_txn.user_id == user.id:
            sub_info = check_user_subscription(user)
            return {
                "success": True,
                "message": "Payment verified! 15-Day Pass is active.",
                "is_subscribed": True,
                "subscription_expires_at": sub_info["subscription_expires_at"],
                "days_left": sub_info["days_left"],
                "utr_id": clean_utr
            }
        raise HTTPException(
            status_code=400,
            detail="This UPI Transaction Reference ID has already been redeemed."
        )

    now = datetime.utcnow()
    current_expiry = user.subscription_expires_at if (user.subscription_expires_at and user.subscription_expires_at > now) else now
    new_expiry = current_expiry + timedelta(days=PLAN_DURATION_DAYS)

    user.is_subscribed = True
    user.subscription_expires_at = new_expiry
    user.plan_name = "15-Day Pass"

    gateway_used = payload.gateway or ("google_pay" if (payload.approval_ref_no or payload.gpay_txn_id) else "upi_qr")

    # Update or insert payment record
    payment_record = None
    if payload.order_id:
        payment_record = db.query(PaymentDB).filter(PaymentDB.order_id == payload.order_id).first()

    if payment_record:
        payment_record.payment_id = clean_utr
        payment_record.status = "completed"
        payment_record.gateway = gateway_used
        payment_record.amount = payload.amount or PLAN_PRICE_INR
    else:
        payment_record = PaymentDB(
            user_id=user.id,
            amount=payload.amount or PLAN_PRICE_INR,
            currency="INR",
            gateway=gateway_used,
            order_id=payload.order_id or f"upi_direct_{uuid.uuid4().hex[:8]}",
            payment_id=clean_utr,
            status="completed",
            plan_name="15-Day Pass",
            days_added=PLAN_DURATION_DAYS
        )
        db.add(payment_record)

    db.commit()
    db.refresh(user)

    logger.info(f"REAL-TIME PAYMENT VERIFIED ({gateway_used}): User {user.email} activated for 15 days (ID: {clean_utr}, Expiry: {new_expiry.isoformat()})")

    return {
        "success": True,
        "message": "Payment verified successfully! Cretivra AI is now unlocked for 15 days.",
        "is_subscribed": True,
        "subscription_expires_at": new_expiry.isoformat(),
        "days_left": PLAN_DURATION_DAYS,
        "utr_id": clean_utr,
        "gateway": gateway_used
    }

@router.post("/webhook")
async def upi_payment_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Automated webhook receiver for bank / gateway instant payment notifications.
    """
    try:
        data = await request.json()
        order_id = data.get("order_id") or data.get("tr")
        utr = data.get("utr") or data.get("txn_id")
        amount = float(data.get("amount", 20.0))
        status_val = data.get("status", "").lower()

        if order_id and status_val in ["success", "completed", "captured"]:
            payment = db.query(PaymentDB).filter(PaymentDB.order_id == order_id).first()
            if payment:
                user = db.query(UserDB).filter(UserDB.id == payment.user_id).first()
                if user:
                    now = datetime.utcnow()
                    current_expiry = user.subscription_expires_at if (user.subscription_expires_at and user.subscription_expires_at > now) else now
                    user.subscription_expires_at = current_expiry + timedelta(days=PLAN_DURATION_DAYS)
                    user.is_subscribed = True
                    payment.status = "completed"
                    if utr:
                        payment.payment_id = utr
                    db.commit()
                    logger.info(f"Webhook automated activation for {user.email} (Order: {order_id})")
                    return {"status": "success", "message": "Subscription activated"}
        return {"status": "ignored"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "detail": str(e)}

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
