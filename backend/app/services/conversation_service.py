from datetime import datetime, timezone, timedelta
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
        model_id: str = "asura-balanced",
        user_id: Optional[str] = None
    ) -> ConversationDB:
        alias_map = {
            "cretivra-1": "asura-balanced",
            "cretivra-1.1": "asura-balanced",
            "cretivra-1.2": "asura-fast",
            "cretivra-fast": "asura-fast",
            "cretivra-reason": "asura-reasoning",
            "cretivra-coder": "asura-coding",
            "cretivra-vision": "asura-vision",
            "cretivra-creative": "asura-creative"
        }
        resolved_model_id = alias_map.get(model_id, model_id)
        conv = ConversationDB(
            title=title,
            model_id=resolved_model_id,
            user_id=user_id
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        return conv

    def get_conversation(self, db: Session, conversation_id: str) -> Optional[ConversationDB]:
        return db.query(ConversationDB).filter(ConversationDB.id == conversation_id).first()

    def get_conversation_state(self, db: Session, conversation_id: str) -> Dict[str, Any]:
        conv = self.get_conversation(db, conversation_id)
        if not conv:
            return {"active_entities": [], "topic_summary": "", "summary_upto_message_id": None}
        return {
            "active_entities": list(conv.active_entities or []),
            "topic_summary": str(conv.topic_summary or ""),
            "summary_upto_message_id": conv.summary_upto_message_id
        }

    def update_conversation_state(
        self,
        db: Session,
        conversation_id: str,
        active_entities: Optional[List[str]] = None,
        topic_summary: Optional[str] = None,
        summary_upto_message_id: Optional[str] = None
    ) -> None:
        conv = self.get_conversation(db, conversation_id)
        if not conv:
            return
        if active_entities is not None:
            conv.active_entities = active_entities
        if topic_summary is not None:
            conv.topic_summary = topic_summary
        if summary_upto_message_id is not None:
            conv.summary_upto_message_id = summary_upto_message_id
        try:
            db.commit()
            db.refresh(conv)
        except Exception as e:
            db.rollback()
            logger.warning(f"Failed to update conversation state: {e}")

    def get_messages(self, db: Session, conversation_id: str) -> List[MessageDB]:
        conv = self.get_conversation(db, conversation_id)
        return list(conv.messages) if conv and conv.messages else []

    def list_conversations(
        self,
        db: Session,
        search_query: Optional[str] = None,
        limit: int = 100,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not user_id:
            return {
                "conversations": [],
                "grouped": {
                    "today": [],
                    "yesterday": [],
                    "previous_7_days": [],
                    "older": []
                }
            }

        query = db.query(ConversationDB).filter(ConversationDB.user_id == user_id)

        if search_query and search_query.strip():
            sq = f"%{search_query.strip()}%"
            # Search matching title or any message content in conversation
            subq = db.query(MessageDB.conversation_id).filter(MessageDB.content.ilike(sq)).subquery()
            query = query.filter(
                or_(
                    ConversationDB.title.ilike(sq),
                    ConversationDB.id.in_(subq.select())
                )
            )

        conversations = query.order_by(desc(ConversationDB.updated_at)).limit(limit).all()

        # Group conversations by date: Today, Yesterday, Previous 7 Days, Older
        now = datetime.now(timezone.utc)
        today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
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
            if c_date and c_date.tzinfo is None:
                c_date = c_date.replace(tzinfo=timezone.utc)
            item = {
                "id": c.id,
                "title": c.title,
                "model_id": c.model_id,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
                "message_count": len(c.messages)
            }
            if c_date and c_date >= today_start:
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

        conv.updated_at = datetime.now(timezone.utc)
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

    def bulk_delete_conversations(self, db: Session, conversation_ids: List[str], user_id: Optional[str] = None) -> int:
        deleted_count = 0
        for cid in conversation_ids:
            conv = self.get_conversation(db, cid)
            if conv:
                if conv.user_id and user_id and conv.user_id != user_id:
                    continue
                db.delete(conv)
                deleted_count += 1
        db.commit()
        return deleted_count


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
            conv.updated_at = datetime.now(timezone.utc)

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
        msg.updated_at = datetime.now(timezone.utc)
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

    async def summarize_and_update_state(
        self,
        conversation_id: str,
        new_entities: List[str],
        dropped_turns: Optional[List[Dict[str, Any]]] = None,
        summary_upto_message_id: Optional[str] = None
    ) -> None:
        """
        Background task to update active_entities and summarize dropped turns on 'Asura Summarizer'.
        """
        from app.database.database import SessionLocal
        from app.core.model_manager import model_manager

        db = SessionLocal()
        try:
            conv = self.get_conversation(db, conversation_id)
            if not conv:
                return

            existing_entities = list(conv.active_entities or [])
            for ent in new_entities:
                if ent and ent not in existing_entities:
                    existing_entities.append(ent)
            active_entities = existing_entities[-15:]

            topic_summary = conv.topic_summary or ""

            if dropped_turns:
                turns_formatted = []
                for t in dropped_turns:
                    role = t.get("role", "user")
                    c = str(t.get("content", ""))[:400]
                    turns_formatted.append(f"{role}: {c}")
                turns_text = "\n".join(turns_formatted)

                messages = [
                    {
                        "role": "system",
                        "content": (
                            "You are the Asura AI conversation summarizer. Summarize key facts, "
                            "established context, and entities from the provided conversation turns into a "
                            "concise rolling summary (~120 words). Focus only on factual information that might "
                            "be referenced later. Do not include pleasantries or meta commentary."
                        )
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Previous topic summary (if any):\n{topic_summary}\n\n"
                            f"Dropped conversation turns to incorporate:\n{turns_text}\n\n"
                            "Produce an updated, concise rolling summary (~120 words):"
                        )
                    }
                ]

                new_summary = await model_manager.complete_task(
                    logical_mode="Asura Summarizer",
                    messages=messages,
                    json_mode=False,
                    max_tokens=250,
                    timeout=5.0,
                    temperature=0.0
                )
                if new_summary and new_summary.strip():
                    topic_summary = new_summary.strip()
                    logger.info(f"[ASURA SUMMARIZER] Updated topic summary for conversation {conversation_id} ({len(topic_summary)} chars)")

            self.update_conversation_state(
                db=db,
                conversation_id=conversation_id,
                active_entities=active_entities,
                topic_summary=topic_summary,
                summary_upto_message_id=summary_upto_message_id
            )
        except Exception as e:
            logger.warning(f"Error in background state update for conversation {conversation_id}: {e}")
        finally:
            db.close()

conversation_service = ConversationService()
