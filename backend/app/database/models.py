import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_subscribed = Column(Boolean, default=False)
    subscription_expires_at = Column(DateTime, nullable=True)
    plan_name = Column(String, default="15-Day Pass")
    created_at = Column(DateTime, default=datetime.utcnow)

    conversations = relationship("ConversationDB", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("PaymentDB", back_populates="user", cascade="all, delete-orphan", order_by="desc(PaymentDB.created_at)")

class ConversationDB(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, default="New Conversation")
    model_id = Column(String, default="cretivra-1", nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserDB", back_populates="conversations")
    messages = relationship("MessageDB", back_populates="conversation", cascade="all, delete-orphan", order_by="MessageDB.created_at")
    attachments = relationship("AttachmentDB", back_populates="conversation", cascade="all, delete-orphan")

class MessageDB(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    reasoning_status = Column(String, nullable=True)  # Thinking, Analyzing, Completed, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversation = relationship("ConversationDB", back_populates="messages")
    attachments = relationship("AttachmentDB", back_populates="message")

class AttachmentDB(Base):
    __tablename__ = "attachments"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    message_id = Column(String, ForeignKey("messages.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    path = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ConversationDB", back_populates="attachments")
    message = relationship("MessageDB", back_populates="attachments")

class ModelSettingDB(Base):
    __tablename__ = "model_settings"

    id = Column(String, primary_key=True)  # e.g., "cretivra-1"
    display_name = Column(String, nullable=False)
    underlying_model = Column(String, nullable=False)
    description = Column(String, nullable=True)
    provider = Column(String, default="ollama")
    capabilities = Column(JSON, default=list)
    context_length = Column(Integer, default=4096)
    enabled = Column(Boolean, default=True)
    version = Column(String, default="1.0")
    icon = Column(String, nullable=True)
    category = Column(String, default="General")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemSettingDB(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaymentDB(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, default=20.0, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    gateway = Column(String, default="razorpay")  # razorpay, upi, manual
    payment_id = Column(String, nullable=True)
    order_id = Column(String, nullable=True)
    status = Column(String, default="completed")  # completed, pending, failed
    plan_name = Column(String, default="15-Day Pass")
    days_added = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="payments")
