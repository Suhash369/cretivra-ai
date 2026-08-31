from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.database.models import ConversationDB, MessageDB, AttachmentDB
from app.models.registry import registry
from app.core.logging import logger

class ConversationService:
    def create_conversation(
        self,
        db: Session,
        title: str = "New Conversation",
        model_id: str = "cretivra-1",
        user_id: Optional[str] = None
    ) -> ConversationDB:
        conv = ConversationDB(
            title=title,
            model_id=model_id,
            user_id=user_id
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def get_conversation(self, db: Session, conversation_id: str) -> Optional[ConversationDB]:
        return db.query(ConversationDB).filter(ConversationDB.id == conversation_id).first()

    def list_conversations(
        self,
        db: Session,
        search_query: Optional[str] = None,
        limit: int = 100,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        query = db.query(ConversationDB)
        if user_id:
            query = query.filter(ConversationDB.user_id == user_id)
        else:
            query = query.filter(ConversationDB.user_id.is_(None))

        if search_query and search_query.strip():
            sq = f"%{search_query.strip()}%"
            # Search matching title or any message content in conversation
            subq = db.query(MessageDB.conversation_id).filter(MessageDB.content.ilike(sq)).subquery()
            query = query.filter(
                or_(
                    ConversationDB.title.ilike(sq),
                    ConversationDB.id.in_(subq)
                )
            )

        conversations = query.order_by(desc(ConversationDB.updated_at)).limit(limit).all()

        # Group conversations by date: Today, Yesterday, Previous 7 Days, Older
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)
        yesterday_start = today_start - timedelta(days=1)
        seven_days_ago = today_start - timedelta(days=7)

        grouped = {
            "today": [],
            "yesterday": [],
            "previous_7_days": [],
            "older": []
        }

        for c in conversations:
            c_date = c.updated_at or c.created_at
            item = {
                "id": c.id,
                "title": c.title,
                "model_id": c.model_id,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
                "message_count": len(c.messages)
            }
            if c_date >= today_start:
                grouped["today"].append(item)
            elif c_date >= yesterday_start:
                grouped["yesterday"].append(item)
            elif c_date >= seven_days_ago:
                grouped["previous_7_days"].append(item)
            else:
                grouped["older"].append(item)

        return {
            "conversations": [
                {
                    "id": c.id,
                    "title": c.title,
                    "model_id": c.model_id,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                    "updated_at": c.updated_at.isoformat() if c.updated_at else None,
                } for c in conversations
            ],
            "grouped": grouped
        }

    def update_conversation(
        self,
        db: Session,
        conversation_id: str,
        title: Optional[str] = None,
        model_id: Optional[str] = None
    ) -> Optional[ConversationDB]:
        conv = self.get_conversation(db, conversation_id)
        if not conv:
            return None

        if title is not None:
            conv.title = title
        if model_id is not None:
            conv.model_id = model_id

        conv.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(conv)
        return conv

    def delete_conversation(self, db: Session, conversation_id: str) -> bool:
        conv = self.get_conversation(db, conversation_id)
        if not conv:
            return False
        db.delete(conv)
        db.commit()
        return True

    def add_message(
        self,
        db: Session,
        conversation_id: str,
        role: str,
        content: str,
        reasoning_status: Optional[str] = None
    ) -> MessageDB:
        msg = MessageDB(
            conversation_id=conversation_id,
            role=role,
            content=content,
            reasoning_status=reasoning_status
        )
        db.add(msg)

        # Touch conversation updated_at
        conv = self.get_conversation(db, conversation_id)
        if conv:
            conv.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(msg)
        return msg

    def edit_message(
        self,
        db: Session,
        message_id: str,
        new_content: str
    ) -> Dict[str, Any]:
        """
        Edits a user message: updates its content, deletes all subsequent messages,
        and returns updated message list.
        """
        msg = db.query(MessageDB).filter(MessageDB.id == message_id).first()
        if not msg:
            raise ValueError("Message not found.")

        conv_id = msg.conversation_id
        
        # Delete all messages in conversation created AFTER this message
        db.query(MessageDB).filter(
            MessageDB.conversation_id == conv_id,
            MessageDB.created_at > msg.created_at
        ).delete(synchronize_session=False)

        msg.content = new_content
        msg.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(msg)

        return {
            "message": msg,
            "conversation_id": conv_id
        }

    def prepare_regeneration(
        self,
        db: Session,
        message_id: str
    ) -> Dict[str, Any]:
        """
        Prepares regeneration for a target assistant message:
        deletes the target message and any subsequent messages.
        """
        msg = db.query(MessageDB).filter(MessageDB.id == message_id).first()
        if not msg:
            raise ValueError("Target message not found.")

        conv_id = msg.conversation_id
        target_time = msg.created_at

        # Delete target message and subsequent messages
        db.query(MessageDB).filter(
            MessageDB.conversation_id == conv_id,
            MessageDB.created_at >= target_time
        ).delete(synchronize_session=False)

        db.commit()
        return {"conversation_id": conv_id}

    def generate_chat_title(self, user_message: str) -> str:
        """
        Generates a clean, 3-7 word conversation title from the first prompt.
        """
        cleaned = user_message.strip()
        # Remove common preamble prefixes
        prefixes = ["please ", "can you ", "how to ", "what is ", "explain ", "write "]
        lower = cleaned.lower()
        for p in prefixes:
            if lower.startswith(p):
                cleaned = cleaned[len(p):].strip()
                break

        words = cleaned.split()
        if len(words) <= 6:
            title = " ".join(words).capitalize()
        else:
            title = " ".join(words[:6]).capitalize() + "..."
        
        return title[:50] or "New Conversation"

conversation_service = ConversationService()
