from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL
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
                result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                existing_cols = [row[1] for row in result]
                if "email" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
                if "password_hash" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))
                if "full_name" not in existing_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR"))
                conn.commit()
            except Exception:
                pass
