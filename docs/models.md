# Cretivra Model Registry & Mapping Abstraction

## Overview

The user interface strictly exposes Cretivra Model Branding (`Cretivra 1`, `Cretivra Reason`, etc.) while hiding raw underlying open-source model names.

## Model Registry Table

| Cretivra Model ID | Display Name | Default Mapped Model | Capabilities | Category |
| :--- | :--- | :--- | :--- | :--- |
| `cretivra-1` | Cretivra 1 | `llama3` | `["chat", "code"]` | Balanced |
| `cretivra-1.1` | Cretivra 1.1 | `llama3.1` | `["chat", "code", "multimodal"]` | Advanced |
| `cretivra-1.2` | Cretivra 1.2 | `llama3.2` | `["chat", "fast"]` | Fast |
| `cretivra-q` | Cretivra Q | `qwen2.5` | `["chat", "code", "multilingual"]` | Code & Fast |
| `cretivra-m` | Cretivra M | `mistral` | `["chat", "creative"]` | Creative |
| `cretivra-g` | Cretivra G | `gemma` | `["chat"]` | Balanced |
| `cretivra-p` | Cretivra P | `phi` | `["chat", "logic"]` | Compact |
| `cretivra-reason` | Cretivra Reason | `deepseek-r1` | `["chat", "reasoning", "code"]` | Reasoning |

## Admin Model Re-Mapping

You can dynamically re-map any Cretivra model to a new underlying model via the API without modifying frontend code:

```http
PATCH /api/models/cretivra-1
Content-Type: application/json

{
  "model_id": "cretivra-1",
  "underlying_model": "llama3.2",
  "display_name": "Cretivra 1"
}
```
