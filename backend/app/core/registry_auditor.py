import asyncio
import httpx
from typing import Dict, Any, List, Set, Tuple
from app.core.config import settings, DEFAULT_ASURA_REGISTRY
from app.core.logging import logger
from app.core.http_client import get_shared_client

async def run_one_token_test(provider: str, model_id: str) -> Dict[str, Any]:
    """
    Executes a 1-token test call against a specific provider and model ID.
    Returns status: 'ok', 'error', or 'skipped'.
    """
    p = provider.lower()
    client = get_shared_client()

    if p == "groq":
        api_key = settings.GROQ_API_KEY
        if not api_key:
            return {"status": "skipped", "reason": "No GROQ_API_KEY"}
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": "hi"}],
            "max_tokens": 1
        }
        try:
            res = await client.post(url, headers=headers, json=payload, timeout=5.0)
            if res.status_code == 200:
                return {"status": "ok", "provider": p, "model": model_id}
            return {"status": "error", "provider": p, "model": model_id, "code": res.status_code, "detail": res.text[:200]}
        except Exception as e:
            return {"status": "error", "provider": p, "model": model_id, "detail": str(e)}

    elif p == "gemini":
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            return {"status": "skipped", "reason": "No GEMINI_API_KEY"}
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"
        payload = {
            "contents": [{"role": "user", "parts": [{"text": "hi"}]}],
            "generationConfig": {"maxOutputTokens": 1}
        }
        try:
            res = await client.post(url, json=payload, timeout=5.0)
            if res.status_code == 200:
                return {"status": "ok", "provider": p, "model": model_id}
            return {"status": "error", "provider": p, "model": model_id, "code": res.status_code, "detail": res.text[:200]}
        except Exception as e:
            return {"status": "error", "provider": p, "model": model_id, "detail": str(e)}

    elif p == "openrouter":
        api_key = settings.OPENROUTER_API_KEY
        if not api_key:
            return {"status": "skipped", "reason": "No OPENROUTER_API_KEY"}
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": "hi"}],
            "max_tokens": 1
        }
        try:
            res = await client.post(url, headers=headers, json=payload, timeout=5.0)
            if res.status_code == 200:
                return {"status": "ok", "provider": p, "model": model_id}
            return {"status": "error", "provider": p, "model": model_id, "code": res.status_code, "detail": res.text[:200]}
        except Exception as e:
            return {"status": "error", "provider": p, "model": model_id, "detail": str(e)}

    return {"status": "skipped", "reason": f"Unknown provider: {provider}"}

async def audit_model_registry() -> Dict[str, Any]:
    """
    At startup, run a one-token test call against each model ID in the registry
    for Groq, Gemini and OpenRouter, and log failures.
    """
    import os
    if os.getenv("PYTEST_CURRENT_TEST") and os.getenv("FORCE_AUDIT") != "1":
        return {"ok": [], "error": [], "skipped": []}

    unique_pairs: Set[Tuple[str, str]] = set()

    for mode, entry in DEFAULT_ASURA_REGISTRY.items():
        if isinstance(entry, dict):
            p = entry.get("provider")
            m = entry.get("model")
            if p and m:
                unique_pairs.add((p.lower(), str(m)))
            for fb in entry.get("fallbacks", []):
                fp = fb.get("provider")
                fm = fb.get("model")
                if fp and fm:
                    unique_pairs.add((fp.lower(), str(fm)))

    logger.info(f"[REGISTRY AUDIT] Beginning 1-token audit for {len(unique_pairs)} unique provider/model pairs...")
    tasks = [run_one_token_test(p, m) for p, m in unique_pairs]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    report = {"ok": [], "error": [], "skipped": []}
    for res in results:
        if isinstance(res, Exception):
            logger.warning(f"[REGISTRY AUDIT EXCEPTION]: {res}")
            continue
        status = res.get("status")
        prov = res.get("provider")
        model = res.get("model")
        if status == "ok":
            logger.info(f"[REGISTRY AUDIT OK] {prov} -> {model}")
            report["ok"].append(res)
        elif status == "error":
            logger.warning(
                f"[REGISTRY AUDIT FAILURE] {prov} -> {model} | Error ({res.get('code', 'N/A')}): {res.get('detail', '')}"
            )
            report["error"].append(res)
        else:
            report["skipped"].append(res)

    logger.info(
        f"[REGISTRY AUDIT COMPLETE] OK: {len(report['ok'])}, Errors: {len(report['error'])}, Skipped: {len(report['skipped'])}"
    )
    return report

if __name__ == "__main__":
    asyncio.run(audit_model_registry())
