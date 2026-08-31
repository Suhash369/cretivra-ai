# ==============================================================================
# CRETIVRA AI — GOOGLE COLAB FREE GPU OLLAMA SERVER SCRIPT
# ==============================================================================
# Instructions:
# 1. Open https://colab.research.google.com/
# 2. Select "Runtime" -> "Change runtime type" -> Select "T4 GPU"
# 3. Paste this code block into a cell and run!
# ==============================================================================

import os
import time

print("🚀 Step 1: Installing Ollama & PyNgrok on Colab...")
os.system("curl -fsSL https://ollama.com/install.sh | sh")
os.system("pip install -q pyngrok")

print("🚀 Step 2: Starting Ollama GPU Inference Service (Host 0.0.0.0:11434)...")
os.system("OLLAMA_HOST=0.0.0.0:11434 nohup ollama serve > /dev/null 2>&1 &")
time.sleep(5)

print("🚀 Step 3: Downloading AI Models (llama3 & deepseek-r1)...")
os.system("OLLAMA_HOST=0.0.0.0:11434 ollama pull llama3")
os.system("OLLAMA_HOST=0.0.0.0:11434 ollama pull deepseek-r1")

from pyngrok import ngrok

# Get free token from https://dashboard.ngrok.com
NGROK_TOKEN = input("Enter your Ngrok Authtoken (or press Enter if configured): ")
if NGROK_TOKEN.strip():
    ngrok.set_auth_token(NGROK_TOKEN.strip())

public_url = ngrok.connect(11434, "http")

print("\n" + "=" * 65)
print("🎉 CRETIVRA AI FREE GPU BACKEND IS NOW LIVE!")
print("=" * 65)
print(f"OLLAMA PUBLIC API URL: {public_url.public_url}")
print("=" * 65)
print("\n👉 Paste this URL into Render Environment Variable: OLLAMA_BASE_URL")
