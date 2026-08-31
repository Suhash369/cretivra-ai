# CRETIVRA AI — Product Roadmap

This document outlines the multi-version evolutionary roadmap for the Cretivra AI platform.

---

### VERSION 1 — Local-First Core Engine [CURRENT COMPLETED RELEASE]
- [x] Local AI chat architecture powered by Ollama engine
- [x] Cretivra Model Registry mapping layer (`cretivra-1`, `cretivra-reason`, etc.)
- [x] Real-time SSE response streaming with stop generation
- [x] Persistent SQLite database with conversation history & grouped date filtering
- [x] Secure Markdown rendering & syntax-highlighted code blocks with copy action
- [x] Multimodal file uploads (PDF, DOCX, TXT, CSV, MD, PNG, JPG) with text extraction
- [x] Compact reasoning status indicator for Cretivra Reason model
- [x] Message editing with history re-branching and response regeneration
- [x] Local instant conversation search across titles & contents
- [x] System health dashboard & customizable AI settings panel

---

### VERSION 2 — Document Intelligence & RAG Engine
- [ ] RAG architecture activation with ChromaDB vector store integration
- [ ] Automated chunking strategies (semantic, fixed size, parent-child)
- [ ] Local embedding generation via Ollama embedding models
- [ ] Document library & knowledge base management for chats

---

### VERSION 3 — Web Search & Deep Research Mode
- [ ] Perplexity-style Research Mode integration
- [ ] Multi-query expansion & search query planner
- [ ] Live web search crawling & source ranking
- [ ] Explicit non-fabricated source citation rendering

---

### VERSION 4 — Autonomous Agent & Tool System
- [ ] Function calling and permission-based tool execution
- [ ] Tool registry (Python sandbox, calculator, file search, browser automation)
- [ ] Multi-step agent planner and executor loop

---

### VERSION 5 — Voice & Multimodal Vision
- [ ] Native image input vision processing (Cretivra Vision)
- [ ] Audio transcription (Whisper integration) & speech synthesis
- [ ] Real-time voice conversation mode

---

### VERSION 6 — Cloud Infrastructure & Enterprise Features
- [ ] Multi-user authentication & SSO integration
- [ ] Cloud sync & multi-device session continuity
- [ ] Rate limits, team workspaces, and role-based access control (RBAC)

---

### VERSION 7 — Cretivra Proprietary Models & Model Serving
- [ ] Proprietary model training & domain-specific fine-tuning
- [ ] High-throughput custom vLLM / TensorRT-LLM model serving infrastructure
- [ ] Direct Cretivra 2 / Cretivra 3 model deployments
