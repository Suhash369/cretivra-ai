# Cretivra AI — Complete Model Registry & AI Architecture

## Overview

Cretivra AI uses a proprietary model registry and branding abstraction layer. The frontend UI strictly presents branded Cretivra model names (`Cretivra 1`, `Cretivra Reason`, `Cretivra FLUX.1 Art`, etc.) while intelligently routing requests to the appropriate underlying open-source weights, cloud hardware accelerators (Groq / Gemini), or image generation diffusion backends.

---

## 🧠 1. Language & Reasoning Models

| Model ID | Display Name | Default Underlying Model | Cloud Accelerator (Groq / Gemini) | Capabilities | Category | Context Window |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cretivra-1` | **Cretivra 1** | `llama3` / `llama3.3` | `openai/gpt-oss-120b` | `["chat", "code"]` | Balanced | 128,000 tokens |
| `cretivra-1.1` | **Cretivra 1.1** | `llama3.1` | `openai/gpt-oss-120b` | `["chat", "code", "multimodal"]` | Advanced | 128,000 tokens |
| `cretivra-1.2` | **Cretivra 1.2** | `llama3.2` | `openai/gpt-oss-20b` | `["chat", "fast"]` | Fast | 128,000 tokens |
| `cretivra-q` | **Cretivra Q** | `qwen2.5` | `openai/gpt-oss-120b` | `["chat", "code", "multilingual"]` | Code & Fast | 128,000 tokens |
| `cretivra-coder` | **Cretivra Coder Pro** | `qwen2.5-coder:32b` | `openai/gpt-oss-120b` / OpenRouter | `["chat", "code", "architecture"]` | Code Specialist | 131,072 tokens |
| `cretivra-omni` | **Cretivra Omni 4** | `gpt-4o` | `openai/gpt-oss-120b` / Gemini 3.7 | `["chat", "code", "vision", "reasoning"]` | Omni Intelligence | 128,000 tokens |
| `cretivra-deepseek` | **Cretivra DeepSeek R1** | `deepseek-r1:70b` | DeepSeek API / OpenRouter | `["chat", "reasoning", "math", "code"]` | Deep Reasoning | 131,072 tokens |
| `cretivra-m` | **Cretivra M** | `mistral` | `groq/compound` | `["chat", "creative"]` | Creative | 32,768 tokens |
| `cretivra-g` | **Cretivra G** | `gemma` / `gemma2` | `openai/gpt-oss-20b` | `["chat"]` | Balanced | 8,192 tokens |
| `cretivra-p` | **Cretivra P** | `phi` / `phi-3` | `openai/gpt-oss-20b` | `["chat", "logic"]` | Compact | 16,384 tokens |
| `cretivra-reason` | **Cretivra Reason** | `deepseek-r1` | `openai/gpt-oss-120b` | `["chat", "reasoning", "code"]` | Reasoning | 128,000 tokens |

---

## 🎨 2. Visual & Image Generation Models (Cretivra Image Studio)

Cretivra AI includes built-in AI Image Generation powered by dedicated diffusion engines:

| Model ID | Display Name | Engine / Underlying Architecture | Specialization |
| :--- | :--- | :--- | :--- |
| `cretivra-flux` | **Cretivra FLUX.1 Art** | `flux` (FLUX.1 Schnell/Dev) | State-of-the-art visual generation & digital art |
| `cretivra-diffusion`| **Cretivra SDXL Studio** | `flux-realism` | Photorealistic portraits, studio lighting, landscape photography |
| `cretivra-turbo` | **Cretivra Turbo Visuals** | `turbo` (SDXL Turbo) | Ultra-fast real-time instant image synthesis |
| `cretivra-anime` | **Cretivra Anime Studio** | `flux-anime` | High-definition anime, manga, and stylized Japanese art |
| `cretivra-3d` | **Cretivra 3D & CGI** | `flux-3d` | Cinematic 3D renders, Octane Render, Unreal Engine 5 CGI |

---

## ⚡ 3. Multi-Tier Inference Pipeline

When a prompt is submitted:
1. **Visual Intent Detection**: If an image prompt or an image model (`cretivra-flux`, etc.) is selected, it routes to `ImageService` to synthesize high-res images in real time.
2. **Local / Colab Ollama**: If Ollama is running (`localhost:11434` or remote Ngrok GPU), requests stream directly from local open-source weights.
3. **High-Speed Cloud Inference**: If Ollama is offline, requests seamlessly stream through **Groq API** (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) or **Google Gemini API** (`gemini-flash-latest`, `gemini-3.6-flash`).
4. **Intelligent Fallback Engine**: If completely offline with no network or API keys, Cretivra AI responds using an algorithmic multi-turn context synthesizer.

---

## 🔧 4. Dynamic Model Re-Mapping (Admin API)

Administrators can dynamically re-map any Cretivra model to a different underlying open-source model tag without modifying frontend code:

```http
PATCH /api/models/cretivra-1
Content-Type: application/json

{
  "model_id": "cretivra-1",
  "underlying_model": "llama3.3",
  "display_name": "Cretivra 1 (Llama 3.3 Enhanced)"
}
```
