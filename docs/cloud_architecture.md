# CRETIVRA AI — Cloud Production Hosting Guide

This guide details the step-by-step implementation for hosting **CRETIVRA AI** using **Vercel**, **Render**, **Supabase**, and dedicated cloud accelerators.

---

## 📐 Architecture Overview

```
Cretivra Frontend
     │
   Vercel (Production Web Hosting)
     │
     ▼
Render Backend (FastAPI Web Service)
     │
     ├──────────→ Supabase (PostgreSQL DB)
     │             │
     │             ├── Users & Auth
     │             ├── Chats & Messages
     │             ├── Usage & Rate Limits
     │             ├── User Feedback
     │             └── Access Status
     │
     └──────────→ Cretivra Neural Core (Cloud Accelerator / GPU Compute)
                   │
                   ├── Cretivra Foundation Weights (Cretivra 1, Reason, Omni)
                   ├── Cretivra Image Studio (Diffusion & Visual Synthesis)
                   └── Secure Tunnel / Direct Endpoint
```

---

## 🚀 Step-by-step Cloud Deployment Setup

---

### Step 1: Set Up Free GPU AI Server on Google Colab

1. Open [Google Colab](https://colab.research.google.com/) and create a new notebook.
2. Set Runtime type to **T4 GPU** (`Runtime -> Change runtime type -> T4 GPU`).
3. Paste and run your setup script to launch the Cretivra Neural Core with a secure tunnel:

```python
# ==========================================
# CRETIVRA AI — Colab GPU Neural Server Setup
# ==========================================

import os
import subprocess
import time
from pyngrok import ngrok

# Expose Cretivra port via secure tunnel
NGROK_TOKEN = "YOUR_NGROK_AUTHTOKEN"
ngrok.set_auth_token(NGROK_TOKEN)

public_url = ngrok.connect(11434, "http")
print("\n" + "="*50)
print(f"🚀 CRETIVRA NEURAL CORE PUBLIC API URL: {public_url.public_url}")
print("="*50 + "\n")
print("Set this URL in Render Environment Variable: CRETIVRA_ENGINE_URL")
```

4. Copy the generated secure public URL.

---

### Step 2: Set Up Database on Supabase

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
   - `PYTHONPATH`: `backend`
5. Click **Deploy**. Render will output your backend URL: `https://asura-ai-backend.onrender.com`.

---

### Step 4: Deploy Frontend on Vercel / Cloud

1. Sign up at [Vercel](https://vercel.com/).
2. Click **Add New -> Project** and import your GitHub Repository.
3. Configure Project Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://asura-ai-backend.onrender.com`
5. Click **Deploy**.

---

## ✅ Cloud Setup Summary

| Component | Provider | Tier | Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | Vercel / Cloud | Production | High-performance React UI |
| **Backend** | Render | Production | FastAPI Engine & PDF/PPTX Services |
| **Database** | Supabase | Managed | Cloud PostgreSQL Persistence |
| **GPU Inference** | Cretivra Neural Core | Dedicated GPU | High-Speed Neural Inference |
