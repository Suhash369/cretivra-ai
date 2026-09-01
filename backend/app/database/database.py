from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = (settings.DATABASE_URL or "").strip().strip("'").strip('"')
# Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# For SQLite, check_same_thread=False allows multi-threaded requests
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.database import models  # noqa
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate missing columns for SQLite
    if db_url.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                # 1. users table migrations
                result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                existing_cols = [row[1] for row in result]
                if "email" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
                if "username" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR"))
                if "password_hash" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
                if "full_name" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
                if "is_subscribed" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_subscribed BOOLEAN DEFAULT 0"))
                if "subscription_expires_at" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME"))
                if "plan_name" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN plan_name VARCHAR DEFAULT '15-Day Pass'"))
                if "created_at" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME"))

                # 2. conversations table migrations
                conv_result = conn.execute(text("PRAGMA table_info(conversations)")).fetchall()
                conv_cols = [row[1] for row in conv_result]
                if "user_id" not in conv_cols:
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN user_id VARCHAR"))
                if "model_id" not in conv_cols:
                    conn.execute(text("ALTER TABLE conversations ADD COLUMN model_id VARCHAR DEFAULT 'cretivra-1'"))

                # 3. messages table migrations
                msg_result = conn.execute(text("PRAGMA table_info(messages)")).fetchall()
                msg_cols = [row[1] for row in msg_result]
                if "reasoning_status" not in msg_cols:
                    conn.execute(text("ALTER TABLE messages ADD COLUMN reasoning_status VARCHAR"))

                conn.commit()
            except Exception as e:
                import logging
                logging.getLogger("uvicorn.error").warning(f"SQLite auto-migration notice: {e}")

