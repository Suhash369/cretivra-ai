# Cretivra AI Engine Setup & Model Guide

Cretivra AI connects to the dedicated **Cretivra Neural Core** running locally or via private cloud acceleration.

---

## Cretivra Foundation Model Family

The Cretivra Model Registry powers intelligent capabilities across reasoning, coding, vision, and creative generation:

| Model ID | Branded Name | Specialization | Capabilities |
| :--- | :--- | :--- | :--- |
| `cretivra-1` | **Cretivra 1** | Balanced Everyday Intelligence | General Chat, Research, Analysis |
| `cretivra-1.1` | **Cretivra 1.1** | Advanced Multimodal Frontier | Complex Documents, Vision, Analysis |
| `cretivra-1.2` | **Cretivra 1.2** | High-Velocity Lightweight | Real-time Fast Responses, Low Latency |
| `cretivra-reason` | **Cretivra Reason** | Chain-of-Thought Deep Reasoning | Complex Logic, Mathematics, Architecture |
| `cretivra-coder` | **Cretivra Coder Pro** | Full-Stack Software Engineering | Code Generation, Debugging, Refactoring |
| `cretivra-omni` | **Cretivra Omni 4** | Multimodal Autonomous Agent | Vision Analysis, Multi-Step Workflows |
| `cretivra-flux` | **Cretivra FLUX.1 Art** | Diffusion Visual Generator | High-Fidelity Photorealism & Design |

---

## Verifying Model Registry

To inspect and verify active Cretivra models in your environment:

```bash
# Verify Cretivra models registry status:
python -m app.services.model_registry
```

Cretivra AI automatically provisions active weights, sets up session streaming, and provides full privacy and offline execution.
