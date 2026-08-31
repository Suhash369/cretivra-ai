# ==============================================================================
# CRETIVRA AI — CUSTOM OLLAMA MODEL CREATION SCRIPT
# ==============================================================================
# Creates a custom Cretivra AI model file with ChatGPT 4o system instructions,
# high reasoning capacity, and tuned sampling parameters.
# ==============================================================================

import os
import subprocess

MODELFILE_CONTENT = """
FROM llama3

# Set system prompt for ChatGPT 4o level behavior
SYSTEM \"\"\"
You are Cretivra AI, an ultra-intelligent, helpful, concise, and highly capable AI platform.
You excel at:
- Writing clean, robust, syntax-highlighted code in any programming language (C, C++, Python, JS/TS, Rust, Go, SQL).
- Explaining complex scientific, historical, mathematical, and technical concepts clearly.
- Conversational multi-turn reasoning, remembering chat context, and adapting formatting based on user requests (e.g. passages, letters, bullet points, summaries).
- Always providing direct, truthful, structured, and polished responses.
\"\"\"

# Set sampling parameters
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 8192
"""

def main():
    print("🚀 Creating Modelfile.cretivra...")
    with open("Modelfile.cretivra", "w", encoding="utf-8") as f:
        f.write(MODELFILE_CONTENT.strip())
    print("✓ Modelfile.cretivra created successfully!")

    print("\n🚀 Building custom 'cretivra-1' Ollama model...")
    try:
        res = subprocess.run(["ollama", "create", "cretivra-1", "-f", "Modelfile.cretivra"], capture_output=True, text=True)
        if res.returncode == 0:
            print("🎉 Success! Custom 'cretivra-1' model built and registered in Ollama!")
        else:
            print("Notice: Make sure Ollama is installed and running locally to build local model.")
            print(f"Details: {res.stderr}")
    except Exception as e:
        print(f"Ollama execution note: {e}")

if __name__ == "__main__":
    main()
