# CRETIVRA AI — API Documentation

## System Endpoints

### Health Status
- **GET `/api/health`**
- **Response**:
  ```json
  {
    "status": "healthy",
    "backend": { "status": "connected", "name": "CRETIVRA AI", "version": "1.0.0" },
    "ollama": { "status": "connected", "url": "http://localhost:11434", "installed_models_count": 2 },
    "database": { "status": "connected" },
    "models": { "total_registered": 8, "available_count": 8 }
  }
  ```

### Models Registry
- **GET `/api/models`**: Lists all registered Cretivra models.
- **PATCH `/api/models/{id}`**: Admin endpoint to re-map Cretivra model to a different underlying model.

### Chat & Streaming
- **POST `/api/chat/stream`**: Initiates SSE streaming response for prompt.
- **POST `/api/chat`**: Synchronous non-streaming response.
- **PATCH `/api/messages/{id}`**: Edits user prompt, deletes subsequent messages, and streams new response.
- **POST `/api/messages/{id}/regenerate`**: Regenerates assistant response.

### Conversations
- **GET `/api/conversations`**: Lists conversations grouped by date (supports `?q=search_query`).
- **POST `/api/conversations`**: Creates new conversation.
- **GET `/api/conversations/{id}`**: Gets conversation with full message history.
- **PATCH `/api/conversations/{id}`**: Renames conversation title or changes model.
- **DELETE `/api/conversations/{id}`**: Deletes conversation and attachments.

### File Handling & Settings
- **POST `/api/files/upload`**: Uploads PDF, DOCX, TXT, CSV, MD, PNG, JPG, WEBP files up to 20MB.
- **GET `/api/settings`**: Retrieves system configuration.
- **PATCH `/api/settings`**: Updates default model, temperature, max context messages.
- **POST `/api/settings/clear-conversations`**: Clears all local conversation data.
