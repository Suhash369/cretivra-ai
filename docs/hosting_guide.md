# CRETIVRA AI — Production Hosting & Deployment Guide

This guide explains how to host **CRETIVRA AI** and configure local AI models (Ollama) so the application functions seamlessly as a private, ChatGPT-like platform.

---

## ⚡ Step 1: Make it Work Like ChatGPT (Local LLM Setup)

By default, when Ollama is offline or no models are loaded, Cretivra AI operates in **Simulation / Safety Fallback Mode**. To get live AI answers just like ChatGPT:

### 1. Start the Ollama Service
Ensure Ollama is running on your machine:
```bash
# Verify Ollama installation & status:
ollama list
```
*(If Ollama is not installed, download it from [ollama.com](https://ollama.com)).*

### 2. Pull Your Preferred Open-Source LLMs
Run the following commands in your terminal to download models:

```bash
# 💬 Standard ChatGPT-like Conversational Model (Recommended):
ollama pull llama3

# 🔬 Deep Reasoning Model (For Cretivra Reason):
ollama pull deepseek-r1

# ⚡ High-Performance Code Model (For Cretivra Code):
ollama pull qwen2.5-coder
```

### 3. Open Cretivra AI
Go to `http://localhost:5173` (or your hosted domain). Cretivra AI automatically detects installed models and streams real-time AI responses!

---

## 🌐 Step 2: Hosting Options

---

### 🐳 Option A: Docker Container Deployment (Recommended for Servers)

Use the built-in Docker setup to launch the FastAPI backend, Vite frontend, and persistent database in a single command.

```bash
# Build and launch all containers in detached mode:
docker-compose up --build -d

# Check running container status:
docker-compose ps
```

Access Cretivra AI at **`http://localhost:8000`** or **`http://<SERVER_IP>:8000`**.

---

### 🏠 Option B: Local Home Network Hosting (Wi-Fi Sharing)

Share Cretivra AI with all devices (phones, laptops, tablets) on your home or office Wi-Fi network:

1. **Start Backend bound to all interfaces**:
   ```bash
   $env:PYTHONPATH="backend"
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend exposed to host**:
   ```bash
   cd frontend
   npm run dev -- --host
   ```

3. **Find your local IP address**:
   - Windows: Run `ipconfig` (Look for `IPv4 Address`, e.g., `192.168.1.50`).
   - Mac/Linux: Run `ifconfig` or `ip a`.

4. Access from any device on your Wi-Fi: **`http://192.168.1.50:5173`**.

---

### ☁️ Option C: Cloud VPS Deployment (DigitalOcean / Hetzner / AWS)

To host Cretivra AI on a public cloud server with SSL HTTPS domain:

#### 1. Provision a VPS
- Recommended specs: 4 vCPUs, 8GB+ RAM (or GPU instance for fast inference).
- OS: Ubuntu 24.04 LTS.

#### 2. Install Dependencies
```bash
sudo apt update && sudo apt install -y docker.exe docker-compose-plugin nginx certbot python3-certbot-nginx
curl -fsSL https://ollama.com/install.sh | sh
```

#### 3. Pull LLM Models on VPS
```bash
ollama pull llama3
```

#### 4. Clone & Launch Cretivra AI
```bash
git clone <YOUR_GIT_REPO_URL>
cd cretivra-ai
docker-compose up --build -d
```

#### 5. Configure Nginx Reverse Proxy & SSL
Create `/etc/nginx/sites-available/cretivra`:
```nginx
server {
    server_name ai.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable site & obtain free SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/cretivra /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ai.yourdomain.com
```

Now your private ChatGPT alternative is live at **`https://ai.yourdomain.com`**!

---

### 🔒 Option D: Public HTTPS Tunneling (Cloudflare Tunnel)

To securely share your local machine instance over HTTPS without opening firewall ports:

```bash
# Run free Cloudflare Tunnel:
npx cloudflared tunnel --url http://localhost:5173
```
Cloudflare will print a secure public HTTPS URL (e.g. `https://random-words.trycloudflare.com`) that you can share with anyone!
