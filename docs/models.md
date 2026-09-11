# Cretivra AI — Unified Model Registry & Architecture

## Overview

Cretivra AI features a proprietary model registry and unified intelligent architecture. All client interfaces strictly interact with branded Cretivra model tiers (`Cretivra 1`, `Cretivra Reason`, `Cretivra Omni 4`, `Cretivra FLUX.1 Art`, etc.) with intelligent dynamic dispatch, streaming inference, and multimodal synthesis.

---

## 🧠 1. Language & Reasoning Models

| Model ID | Display Name | Core Engine | Capabilities | Category | Context Window |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cretivra-1` | **Cretivra 1** | `cretivra-core-v1` | `["chat", "code"]` | Balanced | 128,000 tokens |
| `cretivra-1.1` | **Cretivra 1.1** | `cretivra-core-v1.1` | `["chat", "code", "multimodal"]` | Advanced | 128,000 tokens |
| `cretivra-1.2` | **Cretivra 1.2** | `cretivra-core-fast` | `["chat", "fast"]` | Fast | 128,000 tokens |
| `cretivra-q` | **Cretivra Q** | `cretivra-core-poly` | `["chat", "code", "multilingual"]` | Code & Fast | 128,000 tokens |
| `cretivra-coder` | **Cretivra Coder Pro** | `cretivra-coder-core` | `["chat", "code", "architecture"]` | Code Specialist | 131,072 tokens |
| `cretivra-omni` | **Cretivra Omni 4** | `cretivra-omni-core` | `["chat", "code", "vision", "reasoning"]` | Omni Intelligence | 128,000 tokens |
| `cretivra-reason` | **Cretivra Reason** | `cretivra-reason-core` | `["chat", "reasoning", "math", "code"]` | Deep Reasoning | 131,072 tokens |
| `cretivra-m` | **Cretivra M** | `cretivra-creative-core` | `["chat", "creative"]` | Creative | 32,768 tokens |
| `cretivra-g` | **Cretivra G** | `cretivra-compact-core` | `["chat"]` | Balanced | 8,192 tokens |
| `cretivra-p` | **Cretivra P** | `cretivra-logic-core` | `["chat", "logic"]` | Compact | 16,384 tokens |

---

## 🎨 2. Visual & Image Generation Models (Cretivra Image Studio)

Cretivra AI includes built-in AI Image Generation powered by dedicated diffusion engines:

| Model ID | Display Name | Core Engine | Specialization |
| :--- | :--- | :--- | :--- |
| `cretivra-flux` | **Cretivra FLUX.1 Art** | `cretivra-diffusion-v1` | High-fidelity digital art, typography & detailed compositions |
| `cretivra-diffusion`| **Cretivra SDXL Studio** | `cretivra-realism-v1` | Photorealistic portraits, studio lighting, landscape photography |
| `cretivra-turbo` | **Cretivra Turbo Visuals** | `cretivra-turbo-v1` | Ultra-fast real-time instant image synthesis |
| `cretivra-anime` | **Cretivra Anime Studio** | `cretivra-anime-v1` | High-definition stylized animation and graphic novels |
| `cretivra-3d` | **Cretivra 3D & CGI** | `cretivra-cgi-v1` | Cinematic 3D renders, raytraced lighting, Unreal Engine CGI |

---

## ⚡ 3. Multi-Tier Inference Pipeline

When a prompt is submitted:
1. **Visual Intent Detection**: If an image prompt or an image model (`cretivra-flux`, etc.) is selected, it routes to `ImageService` to synthesize high-res images in real time.
2. **Local Cretivra Neural Core**: Requests stream directly from local Cretivra weights with zero telemetry and 100% privacy.
3. **High-Speed Cloud Acceleration**: When remote acceleration is enabled, requests stream through ultra-low-latency dedicated hardware engines.
4. **Intelligent Fallback Engine**: If working air-gapped without network, Cretivra AI responds using an algorithmic multi-turn context synthesizer.

---

## 🔧 4. Dynamic Model Re-Mapping (Admin API)

Administrators can dynamically re-map any Cretivra model tier to upgraded engine weights:

```http
PATCH /api/models/cretivra-1
Content-Type: application/json

{
  "model_id": "cretivra-1",
  "underlying_model": "cretivra-core-v2",
  "display_name": "Cretivra 1 (Pro Edition)"
}
```
