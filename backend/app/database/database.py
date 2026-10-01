import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

db_url = (settings.DATABASE_URL or "").strip().strip("'").strip('"')
# Normalize postgres:// to postgresql:// for SQLAlchemy compatibility
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

def _build_engine(target_url: str):
    if target_url.startswith("sqlite"):
        return create_engine(
            target_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True
        )
    # PostgreSQL configuration with strict network timeouts and keepalives
    connect_args = {
        "connect_timeout": 3,
        "sslmode": "require",
        "keepalives": 1,
        "keepalives_idle": 3,
        "keepalives_interval": 2,
        "keepalives_count": 2,
        "options": "-c statement_timeout=4000"
    }
    return create_engine(
        target_url,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_timeout=3,
        pool_size=5,
        max_overflow=5
    )

try:
    engine = _build_engine(db_url)
except Exception as e:
    # If the default driver (e.g. psycopg 3) is missing, try psycopg2 driver if applicable
    if "psycopg" in str(e).lower() and db_url.startswith("postgresql://"):
        try:
            alt_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
            engine = _build_engine(alt_url)
            db_url = alt_url
        except Exception:
            logger.warning(f"Failed to connect to primary DB ({e}). Falling back to SQLite.")
            db_url = "sqlite:///./cretivra.db"
            engine = _build_engine(db_url)
    else:
        logger.warning(f"Failed to initialize engine for {db_url}: {e}. Falling back to SQLite.")
        db_url = "sqlite:///./cretivra.db"
        engine = _build_engine(db_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _run_sqlite_migrations(target_engine):
    with target_engine.connect() as conn:
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
            logger.warning(f"SQLite auto-migration notice: {e}")

def fallback_to_sqlite():
    global engine, SessionLocal, db_url
    logger.warning("Configuring resilient local SQLite database fallback...")
    db_url = "sqlite:///./cretivra.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
    SessionLocal.configure(bind=engine)
    try:
        from app.database import models  # noqa
        Base.metadata.create_all(bind=engine)
        _run_sqlite_migrations(engine)
        logger.info("Resilient SQLite fallback initialized successfully.")
    except Exception as err:
        logger.error(f"Fallback SQLite initialization error: {err}")

def init_db():
    global engine, SessionLocal, db_url
    from app.database import models  # noqa

    if db_url.startswith("sqlite"):
        try:
            Base.metadata.create_all(bind=engine)
            _run_sqlite_migrations(engine)
            logger.info("Local SQLite database schema initialized successfully.")
        except Exception as e:
            logger.error(f"SQLite initialization error: {e}")
        return

    try:
        # Pre-verify database responsiveness with a quick ping
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        Base.metadata.create_all(bind=engine)
        logger.info("Primary database schema initialized successfully.")
    except Exception as e:
        logger.warning(f"Primary database connection unavailable or timed out: {e}. Falling back to resilient SQLite database...")
        fallback_to_sqlite()


