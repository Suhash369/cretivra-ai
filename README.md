# CRETIVRA ASURA

> **The Unified Multimodal Real-Time AI Assistant by Cretivra**  
> *"Think Beyond. One Assistant. Infinite Intelligence."*

**Cretivra Asura** is a production-quality, multimodal, web-grounded, real-time AI assistant. Engineered with a proprietary routing engine, Asura unifies conversational language models, real-time web intelligence, factual image search, generative visual synthesis, multimodal document understanding, and natural conversational voice with barge-in interruption into one seamless, private, and cohesive experience.

Third-party AI providers and search services operate exclusively as **internal backend infrastructure**. Users interact solely with **Asura**, experiencing a single unified identity: **Cretivra Asura**.

---

## 🏛️ System Architecture

```
                    ┌─────────────────────────┐
                    │     USER INTERACTION    │
                    │   (React / Next.js UI)  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  ASURA INTELLIGENT      │
                    │         ROUTER          │
                    └────────────┬────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     [Intent Detector]   [Entity Detector]    [Capability Router]
     - 16 Intent Types   - Person, Place,     - Asura Fast
     - Temporal Filter     Company, Product   - Asura Balanced
                         - Athletes, Actors   - Asura Reasoning
                                              - Asura Vision
                                              - Asura Creative
            └────────────────────┬────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ CONCURRENT TOOL ENGINE  │
                    │  (Async Parallel Ops)   │
                    └────────────┬────────────┘
            ┌────────────────────┴────────────────────┐
            ▼                                         ▼
   [Web Intelligence]                        [Real Image Search]
   - Live Fact Grounding                     - Real Subject Photos
   - Source Preservation                     - Attribution & Domain
   - Deduplication & Citations               - Full Lightbox Gallery
            │                                         │
            └────────────────────┬────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │     CONTEXT BUILDER     │
                    │ (2026 Grounding & RAG)  │
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   ASURA MODEL MANAGER   │
                    │ (Fallback Orchestration)│
                    └────────────┬────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │  RESPONSE ORCHESTRATOR  │
                    │  - Streaming SSE Chunks │
                    │  - Real Web Sources     │
                    │  - Real Images Gallery  │
                    │  - Related Questions    │
                    │  - Developer Diagnostic │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  STRUCTURED ASURA UI    │
                    └─────────────────────────┘
```

---

## ⚡ Core Capabilities

### 1. Unified Identity & Strict Abstraction
- The user **never** sees or hears third-party vendor names (`Ollama`, `Gemini`, `Groq`, `OpenRouter`, `Tavily`, `Llama`, `Qwen`).
- Standard messages, loading indicators, audio streams, and errors are 100% branded:
  - *"Asura is thinking..."*
  - *"Asura is searching the web..."*
  - *"Asura is finding relevant images..."*
  - *"Asura is analyzing your image..."*
  - *"Asura is creating your image..."*
- If asked *"What AI are you?"*, Asura answers:  
  **"I'm Asura, Cretivra's AI assistant."**
- If asked *"Which model are you using?"*, Asura answers:  
  **"I'm Cretivra Asura. I use multiple AI technologies behind the scenes to provide the best response."**

### 2. Intelligent Intent & Entity Router
Classifies incoming prompts into 16 intent categories without calling unnecessary services:
- **`GENERAL_KNOWLEDGE`** & **`CODE`**: Routed directly to high-speed local or cloud inference without unnecessary web lookups.
- **`CURRENT_INFORMATION`** & **`NEWS`**: Trigger real-time web grounding with source citations.
- **`PERSON`**, **`PLACE`**, **`PRODUCT`**: Extract specific named entities and retrieve real verified images in parallel with biography synthesis.
- **`IMAGE_GENERATION`**: Independent creative synthesis route. Never confuses factual image requests with synthetic generative prompts.
- **`VISION`**: High-detail circuit, schematic, photo, and chart analysis.

### 3. Factual Web Intelligence & Source Citations
- Recognizes temporal indicators (*"latest"*, *"today"*, *"current"*, *"2026"*, *"recent"*, *"breaking"*).
- Gathers real-time search context, filters duplicate links, and embeds clean source metadata (`title`, `url`, `domain`, `snippet`).
- Displays interactive `SourceLinksCard` components with direct domain badges.
- Factual current information is never fabricated: if the web search infrastructure is unreachable, Asura explicitly informs the user that real-time information could not be verified.

### 4. Real Web Image Search vs. Generative Media
- **Image Search**: Queries for real entities (e.g. *"Who is Virat Kohli?"*, *"Show me Chennai"*) fetch authentic, verified images with source links and attributions via `ImageGallery`.
- **Image Generation**: Creative requests (e.g. *"Generate a futuristic Chennai skyline"*) trigger the generative pipeline and display an *"Asura generated this image"* badge.

### 5. Conversational Voice with Barge-In Interruption
- Full-duplex conversational voice pipeline:
  `Microphone -> STT -> Asura Router -> Streaming LLM -> TTS -> Audio Playback`.
- **Barge-In / Interruption**: When the user speaks or taps the orb while Asura is speaking, current audio playback immediately terminates and the new user input is processed instantly.

### 6. Developer & Admin Diagnostics Layer
- An optional diagnostics toggle located in **Settings > AI Model & Parameters**.
- Hidden by default from normal users.
- When toggled on, renders a discrete diagnostics dropdown disclosing:
  - Routing Decision & Intent
  - Internal Provider & Model
  - Latency (ms)
  - Executed Tools & Tokens

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python**: 3.10+ (tested with Python 3.14)
- **Node.js**: 18+ (tested with Node.js 24)
- **Git**
- Optional: [Ollama](https://ollama.com/) running locally on `http://localhost:11434`

---

### 1. Clone & Setup Workspace
```bash
git clone https://github.com/Suhash369/cretivra-ai.git
cd "cretivra ai"
```

---



# Logical Capability Mappings
FAST_MODEL="asura-fast"
BALANCED_MODEL="asura-balanced"
REASONING_MODEL="asura-reasoning"
VISION_MODEL="asura-vision"
CREATIVE_MODEL="asura-creative"
IMAGE_GENERATION_PROVIDER="gemi

---

### 3. Install & Run Backend
```bash
cd backend
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend health check is accessible at `http://localhost:8000/api/health`.

---

### 4. Install & Run Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 📡 REST & Streaming APIs

All endpoints are hosted under `/api/*` and preserve user-facing Cretivra Asura branding:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Comprehensive health check returning active capabilities. |
| `POST` | `/api/chat` | Non-streaming chat returning `AsuraStructuredResponse`. |
| `POST` | `/api/chat/stream` | Server-Sent Events (SSE) streaming with tool status, sources, and images. |
| `POST` | `/api/search` | Web grounding query search returning verified sources. |
| `POST` | `/api/images/search` | Factual real-world image search returning image items with domains. |
| `POST` | `/api/images/generate`| Direct creative image generation returning image URLs and metadata. |
| `POST` | `/api/vision` | Multimodal image and diagram inspection endpoint. |
| `POST` | `/api/voice/chat` | Conversational voice turn with spoken reply and speech audio. |
| `POST` | `/api/voice/stt` | Speech-to-Text transcription. |
| `POST` | `/api/voice/tts` | Text-to-Speech audio synthesis. |
| `GET` | `/api/models` | List available logical Asura capabilities. |

### Health Check Response Example
```json
GET /api/health
{
  "status": "ok",
  "asura": true,
  "web_search": true,
  "image_search": true,
  "image_generation": true,
  "voice": true,
  "vision": true
}
```

---

## 🧪 Testing & Validation

The test suite validates intent routing, temporal grounding, factual image search, generative fallbacks, and voice continuity.

```bash
cd backend
.\venv\Scripts\python.exe test_asura_extended.py
```

### Verified Test Cases:
- **Test 1 (`General Knowledge / Code`)**: `"What is a pointer in C?"` -> Correctly classified as `CODE`, executes on `Asura Fast` without unnecessary web searches.
- **Test 2 (`Entity / Person`)**: `"Who is Virat Kohli?"` -> Extracted as `PERSON`, executes parallel web grounding + real image retrieval, returns biography + sources + real images + follow-up questions.
- **Test 3 (`Breaking News`)**: `"What is the latest news about Virat Kohli?"` -> Classified as `NEWS`, searches current web intelligence and cites verified sources.
- **Test 4 (`Current Pricing`)**: `"What is the current price of iPhone?"` -> Classified as `CURRENT_INFORMATION`, triggers web grounding with citations.
- **Test 5 (`Creative Visual`)**: `"Generate a futuristic Chennai skyline."` -> Classified as `IMAGE_GENERATION`, produces an image with the *"Asura generated this image"* badge.
- **Test 6 (`Logo Synthesis`)**: `"Create a logo for Asura AI."` -> Routed to creative synthesis.
- **Test 7 (`Multimodal Vision`)**: Upload of circuit diagram with `"Explain this circuit."` -> Routed to `Asura Vision`.
- **Test 8 (`Voice Pipeline`)**: Voice prompt -> Router -> Spoken response -> Speech synthesis.
- **Test 9 (`Barge-In / Interruption`)**: Interrupting during speech synthesis halts playback immediately.
- **Test 10 (`Web Search Fallback`)**: When web search is disabled, Asura gracefully communicates that real-time information could not be verified while maintaining conversational chat.
- **Test 11 (`Local AI Fallback`)**: If local Ollama is offline, the model manager seamlessly cascades to cloud providers.
- **Test 12 (`Image Search Failure`)**: If image search times out, the text response continues to render without broken image elements.
- **Test 13 (`Image Generation Failure`)**: If image generation fails, a clear Asura notification is displayed without crashing.
- **Test 14 (`Voice Failure Fallback`)**: If voice audio synthesis is unavailable, text chat remains 100% operational.

---

## 🛡️ Internal Infrastructure Details

For backend developers and systems administrators, Cretivra Asura coordinates the following underlying technologies:
- **Fast LPU Inference**: Groq (Llama-3.3-70b-versatile, ~300 tok/s)
- **Multimodal & Vision**: Google Gemini (gemini-2.5-flash)
- **Local Private Inference**: Ollama (`http://localhost:11434`)
- **Web Grounding & Image Search**: Tavily Search Engine API
- **Generative Media**: Google Gemini Image Gen with high-resolution FLUX/SDXL proxy fallback
- **Relational Storage**: SQLite with SQLAlchemy ORM (`cretivra.db`)

---

## 📄 License

Proprietary software developed by Cretivra. All rights reserved.
