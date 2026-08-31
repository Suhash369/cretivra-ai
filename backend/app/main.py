import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import logger
from app.database.database import init_db
from app.api import health, models, conversations, chat, files, settings as settings_api, auth, images

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Cretivra AI Database...")
    init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    logger.info("Shutting down Cretivra AI backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Cretivra AI — Multi-User Privacy-First AI Platform Architecture",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local dev and cloud production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(images.router, prefix=settings.API_V1_STR)
app.include_router(files.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Cretivra couldn't complete that operation. Please try again."}
    )

# Static frontend mounting if built dist folder exists (for production single-container deployment)
possible_dist_paths = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist"),
    os.path.join(os.getcwd(), "frontend", "dist"),
    "/app/frontend/dist"
]

frontend_dist = None
for p in possible_dist_paths:
    if os.path.exists(p) and os.path.exists(os.path.join(p, "index.html")):
        frontend_dist = p
        break

if frontend_dist:
    logger.info(f"Serving built frontend assets from: {frontend_dist}")
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root_redirect():
        return {
            "name": settings.PROJECT_NAME,
            "tagline": "Your AI. Your data. Your control.",
            "status": "online",
            "docs": "/docs"
        }
