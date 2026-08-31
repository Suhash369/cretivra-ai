# CRETIVRA AI — 100% Free Cloud Production Hosting Guide

This guide details the step-by-step implementation for hosting **CRETIVRA AI** completely for free using **Vercel**, **Render**, **Supabase**, and **Google Colab (Free GPU)**.

---

## 📐 Architecture Overview

```
Cretivra Frontend
     │
   Vercel (Free Static SPA Hosting)
     │
     ▼
Render Backend (Free FastAPI Web Service)
     │
     ├──────────→ Supabase (Free PostgreSQL DB)
     │             │
     │             ├── Users & Auth
     │             ├── Chats & Messages
     │             ├── Usage & Rate Limits
     │             ├── User Feedback
     │             └── Access Status
     │
     └──────────→ Google Colab (Free T4 GPU Compute)
                   │
                   ├── Ollama (LLMs: llama3, deepseek-r1)
                   ├── Image AI (Stable Diffusion / Gemini)
                   └── Ngrok / Cloudflare Tunnel
```

---

## 🚀 Step-by-step Cloud Deployment Setup

---

### Step 1: Set Up Free GPU AI Server on Google Colab

1. Open [Google Colab](https://colab.research.google.com/) and create a new notebook.
2. Set Runtime type to **T4 GPU** (`Runtime -> Change runtime type -> T4 GPU`).
3. Paste and run the following setup script to launch Ollama with Ngrok tunnel:

```python
# ==========================================
# CRETIVRA AI — Colab GPU Ollama Server Setup
# ==========================================

# 1. Install Ollama and Ngrok
!curl -fsSL https://ollama.com/install.sh | sh
!pip install pyngrok

import os
import subprocess
import time
from pyngrok import ngrok

# 2. Start Ollama service in background
subprocess.Popen(["ollama", "serve"])
time.sleep(3)

# 3. Pull required models (Runs at maximum GPU speed!)
!ollama pull llama3
!ollama pull deepseek-r1

# 4. Expose Ollama port 11434 via Ngrok tunnel
NGROK_TOKEN = "YOUR_NGROK_AUTHTOKEN"  # Get free token from https://dashboard.ngrok.com
ngrok.set_auth_token(NGROK_TOKEN)

public_url = ngrok.connect(11434, "http")
print("\n" + "="*50)
print(f"🚀 CRETIVRA OLLAMA PUBLIC API URL: {public_url.public_url}")
print("="*50 + "\n")
print("Set this URL in Render Environment Variable: OLLAMA_BASE_URL")
```

4. Copy the generated `https://xxxx.ngrok-free.app` URL.

---

### Step 2: Set Up Free Database on Supabase

1. Sign up at [Supabase](https://supabase.com/).
2. Create a new project: `cretivra-ai-db`.
3. In `Project Settings -> Database`, copy your **PostgreSQL Connection String**:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. Run the database migration script in Supabase SQL Editor:
   ```sql
   -- Users Table
   CREATE TABLE IF NOT EXISTS users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       email TEXT UNIQUE NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Conversations Table
   CREATE TABLE IF NOT EXISTS conversations (
       id TEXT PRIMARY KEY,
       title TEXT NOT NULL,
       model_id TEXT NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Messages Table
   CREATE TABLE IF NOT EXISTS messages (
       id TEXT PRIMARY KEY,
       conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
       role TEXT NOT NULL,
       content TEXT NOT NULL,
       reasoning_status TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Usage Metrics Table
   CREATE TABLE IF NOT EXISTS usage_logs (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       conversation_id TEXT,
       prompt_tokens INT DEFAULT 0,
       completion_tokens INT DEFAULT 0,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

---

### Step 3: Deploy FastAPI Backend on Render

1. Sign up at [Render](https://render.com/).
2. Click **New + -> Web Service** and connect your GitHub Repository.
3. Configure Build Settings:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables in Render Dashboard:
   - `DATABASE_URL`: `postgresql://postgres:...@db....supabase.co:5432/postgres`
   - `OLLAMA_BASE_URL`: `https://xxxx.ngrok-free.app` *(Your Colab Ngrok URL)*
   - `PYTHONPATH`: `backend`
5. Click **Deploy**. Render will output your backend URL: `https://cretivra-backend.onrender.com`.

---

### Step 4: Deploy Vite Frontend on Vercel

1. Sign up at [Vercel](https://vercel.com/).
2. Click **Add New -> Project** and import your GitHub Repository.
3. Configure Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Environment Variables:
   - `VITE_API_BASE_URL`: `https://cretivra-backend.onrender.com`
5. Click **Deploy**. Vercel will output your production live app URL: **`https://cretivra-ai.vercel.app`**.

---

## ✅ Cloud Setup Summary

| Component | Provider | Tier | URL |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel | Free Tier | `https://cretivra-ai.vercel.app` |
| **Backend** | Render | Free Tier | `https://cretivra-backend.onrender.com` |
| **Database** | Supabase | Free Tier | Managed PostgreSQL |
| **GPU Inference** | Google Colab | Free T4 GPU | Ngrok Tunnel to Ollama |
