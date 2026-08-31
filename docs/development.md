# Local Development Guide

## Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Ollama (installed locally from https://ollama.com)

## Quickstart

1. **Clone & Configure Environment**:
   ```bash
   cp .env.example .env
   ```

2. **Start Backend**:
   ```bash
   python -m venv backend/venv
   # Windows:
   .\backend\venv\Scripts\activate
   pip install -r backend/requirements.txt
   
   # Run server:
   $env:PYTHONPATH="backend"
   python -m uvicorn app.main:app --reload --port 8000
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open browser at `http://localhost:5173`.

4. **Run Backend Tests**:
   ```bash
   $env:PYTHONPATH="backend"
   .\backend\venv\Scripts\pytest backend/tests
   ```
