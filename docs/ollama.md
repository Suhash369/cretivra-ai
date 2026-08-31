# Ollama Setup & Model Preparation

Cretivra AI connects to your local Ollama engine running on `http://localhost:11434`.

## Pulling Recommended Models

To power the Cretivra model registry, pull any of the following open-source models:

```bash
# General AI (Cretivra 1)
ollama pull llama3

# Advanced AI (Cretivra 1.1)
ollama pull llama3.1

# Fast AI (Cretivra 1.2)
ollama pull llama3.2

# Code & Multilingual AI (Cretivra Q)
ollama pull qwen2.5

# Creative Engine (Cretivra M)
ollama pull mistral

# Reasoning AI (Cretivra Reason)
ollama pull deepseek-r1
```

Verify installed models:
```bash
ollama list
```

Cretivra AI automatically maps installed models to Cretivra Model Registry IDs.
