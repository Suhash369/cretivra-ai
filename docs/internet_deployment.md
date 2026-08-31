# Cretivra AI — Multi-User Authentication & Internet Hosting Guide

> **"Your AI. Your data. Your control."**  
> *Production-Ready Multi-User Deployment with Isolated Chat & Search History*

---

## 🔒 1. Multi-User Authentication & Data Privacy Architecture

Cretivra AI features **complete per-user data isolation**:

### How It Works:
1. **User Accounts & Database Storage**:
   - When a user creates an account (`POST /api/auth/register`), their password is encrypted using high-iteration PBKDF2-HMAC-SHA256 with a unique random salt and stored in the database (`users` table in SQLite or PostgreSQL).
   - Upon logging in (`POST /api/auth/login`), a signed JWT access token is returned.

2. **Per-User Isolated Chat & Search History**:
   - Every API request sends `Authorization: Bearer <token>` headers.
   - When fetching conversation lists (`GET /api/conversations`) or executing search queries (`GET /api/conversations?q=...`), the database query is filtered strictly to `ConversationDB.user_id == current_user.id`.
   - **Zero Leaks**: User A can *never* view, search, modify, or delete conversations created by User B (any direct cross-user access attempts return `403 Forbidden`).
   - Guest / Unauthenticated users operate in a separate sandboxed session (`user_id == None`).

---

## 🚀 2. Hosting Cretivra AI on the Internet

You can deploy Cretivra AI to the internet for free using any of the following methods:

---

### **Option A: 100% Free Deployment on Render (Recommended)**

Render can build and run the entire full-stack application (React UI + FastAPI Backend + SQLite/PostgreSQL) in a single unified container for free.

#### Steps:
1. Push your repository to **GitHub** or **GitLab**.
2. Sign in to [Render.com](https://render.com).
3. Click **New +** → **Web Service**.
4. Connect your GitHub repository.
5. Select **Docker** environment (Render will automatically detect the `Dockerfile`).
6. Set the Environment Variables:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `SECRET_KEY` | *(Generate a random 32-character string)* | JWT Token Encryption Secret |
   | `DATABASE_URL` | *(Optional, e.g. Supabase or Neon PostgreSQL URL)* | Defaults to SQLite if left empty |
7. Click **Create Web Service**.
8. Render will build the frontend assets, start FastAPI on port 8000, and give you a free HTTPS URL:
   `https://cretivra-ai.onrender.com`

---

### **Option B: Free Deployment on Railway.app**

1. Sign in to [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your Cretivra repository.
4. Railway will automatically build the `Dockerfile`.
5. Under **Variables**, add:
   - `SECRET_KEY`: `your-secure-random-secret-key`
   - `PORT`: `8000`
6. Under **Settings** → **Generate Domain**, you will get a public live URL:
   `https://cretivra-production.up.railway.app`

---

### **Option C: Deploy on Any Linux VPS (Ubuntu / Debian / DigitalOcean)**

If hosting on your own cloud virtual server:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/cretivra-ai.git
cd cretivra-ai

# 2. Build and run with Docker
docker build -t cretivra-ai .
docker run -d -p 8000:8000 \
  -e SECRET_KEY="your-production-secret-key" \
  -v $(pwd)/data:/app/backend/data \
  --name cretivra cretivra-ai

# 3. (Optional) Set up Nginx & Free SSL with Certbot
sudo apt install nginx certbot python3-certbot-nginx
```

**Nginx Configuration (`/etc/nginx/sites-available/cretivra`)**:
```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        proxy_read_timeout 600s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cretivra /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com
```

---

## 🗄️ 3. Connecting a Free Cloud PostgreSQL Database (Optional)

By default, Cretivra AI stores user accounts and conversations in `cretivra.db` (SQLite). If you wish to use a dedicated cloud database with real-time backups:

1. Create a free PostgreSQL instance at [Supabase.com](https://supabase.com) or [Neon.tech](https://neon.tech).
2. Copy your connection string:
   `DATABASE_URL=postgresql://postgres:yourpassword@db.supabase.co:5432/postgres`
3. Add `DATABASE_URL` to your environment variables on Render / Railway / VPS.
4. Cretivra AI will automatically initialize all tables on startup.

---

## 🔑 4. API Endpoints Summary

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Create new user account | Public |
| `/api/auth/login` | `POST` | Sign in & receive JWT token | Public |
| `/api/auth/me` | `GET` | Get profile for active token | Bearer Token |
| `/api/conversations` | `GET` | Fetch conversations & search history (isolated to current user) | Optional (Bearer) |
| `/api/conversations` | `POST` | Create conversation associated with user | Optional (Bearer) |
| `/api/conversations/{id}` | `GET` | Retrieve conversation (ownership verified) | Optional (Bearer) |
| `/api/conversations/{id}` | `DELETE` | Delete conversation (ownership verified) | Optional (Bearer) |
| `/api/chat/stream` | `POST` | Stream AI response with live status | Optional (Bearer) |
| `/api/images/generate` | `POST` | Generate visual using FLUX.1 / SDXL engines | Public |
