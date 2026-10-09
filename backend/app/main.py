import os
import sys
from pathlib import Path

# Ensure 'backend' directory is in sys.path regardless of execution working directory
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import logger
from app.database.database import init_db
from app.api import health, models, conversations, chat, files, settings as settings_api, auth, images, suggestions, agents as agents_api, playground as playground_api, tools_api, projects_api, artifacts_api, voice, visual, search, vision

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting CRETIVRA ASURA service...", flush=True)
    logger.info("Starting CRETIVRA ASURA service...")

    async def _async_init_db():
        try:
            await asyncio.to_thread(init_db)
        except Exception as e:
            logger.warning(f"Database initialization non-fatal notice: {e}")

    # Initialize DB in background so port binding and health check respond immediately
    asyncio.create_task(_async_init_db())

    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not create upload directory {settings.UPLOAD_DIR}: {e}")

    # Pre-warm allowed providers health status asynchronously
    try:
        from app.providers.groq import groq_provider
        from app.providers.gemini import gemini_provider
        from app.providers.openrouter import openrouter_provider
        asyncio.create_task(groq_provider.health_check())
        asyncio.create_task(gemini_provider.health_check())
        asyncio.create_task(openrouter_provider.health_check())
        from app.core.registry_auditor import audit_model_registry
        asyncio.create_task(audit_model_registry())
    except Exception as e:
        logger.debug(f"Startup task notice: {e}")

    logger.info("CRETIVRA ASURA backend ready. Listening for incoming requests.")
    yield
    logger.info("Shutting down CRETIVRA ASURA backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="CRETIVRA ASURA — Unified Real-Time Multimodal AI Assistant",
    version="2.0.0",
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

from app.core.rate_limit import AsuraRateLimitMiddleware
app.add_middleware(AsuraRateLimitMiddleware)

# Mount Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(images.router, prefix=settings.API_V1_STR)
app.include_router(files.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)
app.include_router(suggestions.router, prefix=settings.API_V1_STR)
app.include_router(agents_api.router, prefix=settings.API_V1_STR)
app.include_router(playground_api.router, prefix=settings.API_V1_STR)
app.include_router(tools_api.router, prefix=settings.API_V1_STR)
app.include_router(projects_api.router, prefix=settings.API_V1_STR)
app.include_router(artifacts_api.router, prefix=settings.API_V1_STR)
app.include_router(voice.router, prefix=settings.API_V1_STR)
app.include_router(visual.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)
app.include_router(vision.router, prefix=settings.API_V1_STR)

@app.get("/health")
def root_health():
    return {"status": "healthy", "service": settings.PROJECT_NAME}

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Asura couldn't complete that operation. Please try again."}
    )

# Static frontend mounting if built dist folder exists
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
    
    @app.exception_handler(404)
    async def custom_404_handler(request: Request, exc):
        if not request.url.path.startswith(settings.API_V1_STR):
            index_file = os.path.join(frontend_dist, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Not found"})
        
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
else:
    @app.get("/")
    def root_redirect():
        return {
            "name": settings.PROJECT_NAME,
            "status": "online",
            "assistant": "Asura"
        }

if __name__ == "__main__":
    import uvicorn
    raw_port = os.environ.get("PORT", "10000")
    try:
        port = int(str(raw_port).strip())
    except (ValueError, TypeError):
        port = 10000
    print(f"Starting Asura AI server on 0.0.0.0:{port}...", flush=True)
    logger.info(f"Starting Asura AI server on 0.0.0.0:{port}...")
    try:
        workers = int(os.environ.get("WEB_CONCURRENCY", "1"))
    except (ValueError, TypeError):
        workers = 1
    app_target = "app.main:app" if workers > 1 else app
    run_kwargs = {
        "host": "0.0.0.0",
        "port": port,
        "proxy_headers": True,
        "forwarded_allow_ips": "*"
    }
    if workers > 1:
        run_kwargs["workers"] = workers
    uvicorn.run(app_target, **run_kwargs)
