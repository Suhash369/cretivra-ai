# Railway Deployment Guide for Cretivra AI

This guide walks you through deploying **Cretivra AI** to [Railway](https://railway.com/) with a production Docker container, live Supabase/PostgreSQL database, and automatic SSL.

---

## Method 1: Deploy via GitHub (Recommended — 2 Minutes)

Because your code is already pushed to GitHub (`Suhash369/cretivra-ai`), Railway can automatically build and deploy it with zero terminal setup.

### Step 1: Create a Project on Railway
1. Go to [railway.com](https://railway.com/) and click **Sign In** (use GitHub).
2. On your dashboard, click **+ New Project**.
3. Select **Deploy from GitHub repo**.
4. Choose `Suhash369/cretivra-ai`.
5. Railway will automatically detect the root `Dockerfile` and `railway.json`.

---

### Step 2: Add Environment Variables
In your Railway project dashboard:
1. Click on your service card.
2. Navigate to the **Variables** tab.
3. Click **RAW Editor** and paste your environment variables from your local `.env` file:

```env
# Database (Live Supabase PostgreSQL or Railway Postgres)
DATABASE_URL=your_supabase_or_railway_postgres_url

# Security
SECRET_KEY=cretivra-vault-secret-key-production-2026

# AI Providers
DEFAULT_MODEL=cretivra-1
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key

# Fallback Settings
ENABLE_MOCK_ENGINE=false
MAX_OUTPUT_TOKENS=4096
MAX_CONTEXT_MESSAGES=30
```

> **Note:** Railway will automatically assign the `$PORT` variable (no manual setting needed).

---

### Step 3: Generate Public Domain
1. In your service, click the **Settings** tab.
2. Scroll down to **Networking**.
3. Click **Generate Domain** (e.g. `cretivra-ai-production.up.railway.app`).
4. Click your generated domain URL — your site is now live on the internet!

---

## Method 2: Deploy from Terminal (Railway CLI)

If you prefer to deploy directly from your local terminal:

```powershell
# 1. Login to Railway in browser
npx @railway/cli login

# 2. Link or create project
npx @railway/cli init

# 3. Upload & Deploy code directly
npx @railway/cli up

# 4. Generate public domain
npx @railway/cli domain
```

---

## Verification
Once deployed:
- **Web UI:** Visit your generated `*.up.railway.app` URL.
- **Backend API & Health Check:** Visit `https://your-domain.up.railway.app/api/health`
- **Swagger Documentation:** Visit `https://your-domain.up.railway.app/docs`
