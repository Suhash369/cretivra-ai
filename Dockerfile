# Multi-stage Docker build for CRETIVRA AI
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and built frontend assets
COPY backend/ ./backend
COPY --from=frontend-builder /frontend/dist ./frontend/dist

ENV PYTHONPATH=/app/backend
ENV OLLAMA_BASE_URL=http://host.docker.internal:11434
EXPOSE 8000

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

