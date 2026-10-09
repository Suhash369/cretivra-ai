import logging
from sqlalchemy import text, inspect

logger = logging.getLogger("uvicorn.error")

def migrate_conversation_state(target_engine):
    """
    Applies schema migration for active_entities, topic_summary, and summary_upto_message_id
    on the conversations table, supporting both SQLite and PostgreSQL.
    """
    dialect_name = target_engine.dialect.name.lower()
    logger.info(f"[DB MIGRATION] Running conversation state migration on dialect={dialect_name}...")

    with target_engine.connect() as conn:
        try:
            if "sqlite" in dialect_name:
                result = conn.execute(text("PRAGMA table_info(conversations)")).fetchall()
                existing_cols = [row[1] for row in result]

                if "active_entities" not in existing_cols:
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN active_entities JSON"))
                    logger.info("[DB MIGRATION] Added column 'active_entities' (JSON) to conversations")
                if "topic_summary" not in existing_cols:
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN topic_summary TEXT"))
                    logger.info("[DB MIGRATION] Added column 'topic_summary' (TEXT) to conversations")
                if "summary_upto_message_id" not in existing_cols:
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN summary_upto_message_id VARCHAR"))
                    logger.info("[DB MIGRATION] Added column 'summary_upto_message_id' (VARCHAR) to conversations")

                conn.commit()
            else:
                # PostgreSQL / Supabase
                result = conn.execute(text(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = 'conversations'"
                )).fetchall()
                existing_cols = [row[0] for row in result]

                if "active_entities" not in existing_cols:
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS active_entities JSONB"))
                    logger.info("[DB MIGRATION] Added column 'active_entities' (JSONB) to conversations")
                if "topic_summary" not in existing_cols:
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS topic_summary TEXT"))
                    logger.info("[DB MIGRATION] Added column 'topic_summary' (TEXT) to conversations")
                if "summary_upto_message_id" not in existing_cols:
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary_upto_message_id VARCHAR"))
                    logger.info("[DB MIGRATION] Added column 'summary_upto_message_id' (VARCHAR) to conversations")

                conn.commit()
            logger.info("[DB MIGRATION] Conversation state migration completed successfully.")
        except Exception as e:
            logger.warning(f"[DB MIGRATION] Notice during conversation state migration: {e}")

if __name__ == "__main__":
    from app.database.database import engine
    migrate_conversation_state(engine)
