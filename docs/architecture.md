# CRETIVRA AI — System Architecture

Cretivra AI is built as a local-first, privacy-respecting AI platform architecture powered by Ollama and an abstraction layer for model registry mapping.

## High-Level Data Flow

```mermaid
graph TD
    User["User Interface"] -->|HTTP / SSE Stream| FastAPI["Cretivra Backend (FastAPI)"]
    FastAPI -->|Check & Persistence| DB[(SQLite Database)]
    FastAPI -->|Resolve Cretivra ID| Registry["CretivraModelRegistry"]
    Registry -->|Map Underlying Model| Router["Model Router"]
    Router -->|HTTP / SSE| Ollama["Ollama Local Service"]
    Ollama -->|Inference| Model["Open Source LLM (Llama3/DeepSeek/Qwen)"]
```

## Future Multi-Engine Architecture

```mermaid
graph TD
    User["User Interface"] --> Platform["Cretivra AI Platform"]
    Platform --> Router["AI Router"]
    Router --> CretivraProprietary["Cretivra Proprietary Models"]
    Router --> OllamaModels["Ollama Open Source LLModels"]
    Router --> RAGEngine["RAG Vector Engine"]
    Router --> WebSearch["Web Search Provider"]
    Router --> AgentTools["Agent Tooling"]
    Router --> Multimodal["Multimodal Engine"]
```

## Component Architecture

1. **Frontend (React + TypeScript + Vite + Tailwind CSS)**:
   - Dynamic prompt composer with multiline auto-expansion.
   - Cretivra Model selector hiding raw underlying Ollama model names.
   - Real-time SSE streaming reader with AbortController for stop generation.
   - Grouped chat history (Today, Yesterday, Previous 7 Days, Older) with local search.
   - Compact reasoning status indicator for Cretivra Reason model.

2. **Backend (Python + FastAPI + SQLAlchemy + Pydantic)**:
   - `CretivraModelRegistry`: maps Cretivra IDs (`cretivra-1`, `cretivra-reason`, etc.) to underlying Ollama model names (`llama3`, `deepseek-r1`, etc.).
   - `OllamaProvider`: httpx async provider supporting SSE streaming, health checks, and fallback simulation mode.
   - `FileService`: validation, parsing, and text extraction for PDF, DOCX, TXT, CSV, MD, PNG, JPG, WEBP formats.
   - `ConversationService`: CRUD operations, message editing (re-branching), regeneration, and concise title generation.
