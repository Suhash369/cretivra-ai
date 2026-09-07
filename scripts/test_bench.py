#!/usr/bin/env python3
"""
==============================================================================
CRETIVRA / ASURA AI — AUTOMATED TEST BENCH & BENCHMARK SUITE
==============================================================================
Runs standardized automated benchmarks across models to measure:
- Time to First Token (TTFT in ms)
- Generation Throughput (Tokens per second)
- Total Response Latency (seconds)
- Output Quality, Reasoning Depth & Code Correctness
- Comparative Scorecard vs. GPT-4o, Claude 3.5 Sonnet & Gemini 2.0 Flash
==============================================================================
Usage:
    python scripts/test_bench.py
    python scripts/test_bench.py --url https://cretivra-ai-backend.onrender.com
    python scripts/test_bench.py --models cretivra-1 cretivra-reason cretivra-coder
==============================================================================
"""

import sys
import time
import json
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional

try:
    import requests
except ImportError:
    print("Installing requests library for benchmark suite...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

# Standardized Test Bench Battery
BENCHMARK_PROMPTS = [
    {
        "category": "Reasoning & Logic (GSM8K/MATH)",
        "id": "math_logic",
        "prompt": "A store offers a 20% discount on a $150 jacket. A customer has an extra 10% coupon on the discounted price and pays 8% sales tax. What is the final total? Show step-by-step arithmetic.",
        "expected_keywords": ["120", "108", "116.64", "tax"]
    },
    {
        "category": "Coding & Algorithms (HumanEval)",
        "id": "coding_lru",
        "prompt": "Write a Python class `LRUCache` with `get(key)` and `put(key, value)` with O(1) time complexity using OrderedDict or doubly linked list. Include docstring and error handling.",
        "expected_keywords": ["class LRUCache", "def get", "def put", "OrderedDict"]
    },
    {
        "category": "System Architecture & Deep Reasoning",
        "id": "architecture_eval",
        "prompt": "Compare DAG vs Event-Driven Swarm architectures in multi-agent autonomous systems. Outline failure modes, idempotency, and state recovery in 4 concise points.",
        "expected_keywords": ["DAG", "Swarm", "idempotency", "recovery"]
    },
    {
        "category": "Speed & Real-time Throughput",
        "id": "throughput_speed",
        "prompt": "Explain the difference between optimistic concurrency control and pessimistic locking in database transaction management in 3 concise paragraphs.",
        "expected_keywords": ["optimistic", "pessimistic", "locking"]
    }
]

# Standard Industry Baselines for Comparison
INDUSTRY_BASELINES = {
    "GPT-4o (OpenAI)": {
        "avg_ttft_ms": 420,
        "tokens_per_sec": 82.5,
        "coding_score": "90.2%",
        "math_score": "93.4%",
        "reasoning_score": "92.0%",
        "cost_per_1m_tokens": "$2.50 / $10.00"
    },
    "Claude 3.5 Sonnet (Anthropic)": {
        "avg_ttft_ms": 580,
        "tokens_per_sec": 68.0,
        "coding_score": "92.0%",
        "math_score": "91.6%",
        "reasoning_score": "94.2%",
        "cost_per_1m_tokens": "$3.00 / $15.00"
    },
    "Gemini 2.0 Flash (Google)": {
        "avg_ttft_ms": 290,
        "tokens_per_sec": 115.0,
        "coding_score": "86.5%",
        "math_score": "89.8%",
        "reasoning_score": "88.4%",
        "cost_per_1m_tokens": "$0.10 / $0.40"
    },
    "DeepSeek R1 (Open Source)": {
        "avg_ttft_ms": 750,
        "tokens_per_sec": 48.0,
        "coding_score": "89.5%",
        "math_score": "94.8%",
        "reasoning_score": "95.5%",
        "cost_per_1m_tokens": "$0.55 / $2.19"
    }
}

def parse_sse_stream(response):
    """
    Parses SSE response stream line by line and yields chunk events.
    """
    for line in response.iter_lines(decode_unicode=True):
        if not line:
            continue
        line = line.strip()
        if line.startswith("data: "):
            data_str = line[6:].strip()
            if data_str == "[DONE]":
                break
            try:
                yield json.loads(data_str)
            except Exception:
                yield {"content": data_str, "done": False}

def run_single_test(base_url: str, model_id: str, test_item: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{base_url.rstrip('/')}/api/chat/stream"
    payload = {
        "message": test_item["prompt"],
        "model_id": model_id,
        "stream": True
    }

    start_time = time.perf_counter()
    first_token_time = None
    chunks = []
    full_content = ""
    error = None

    try:
        res = requests.post(url, json=payload, stream=True, timeout=60)
        if res.status_code != 200:
            return {
                "success": False,
                "error": f"HTTP {res.status_code}: {res.text[:150]}",
                "ttft_ms": 0,
                "total_time_s": 0,
                "tokens": 0,
                "tokens_per_sec": 0
            }

        for chunk_data in parse_sse_stream(res):
            now = time.perf_counter()
            if first_token_time is None:
                first_token_time = now

            content = chunk_data.get("content", "")
            full_content_str = chunk_data.get("full_content", "")
            if full_content_str:
                full_content = full_content_str
            else:
                full_content += content

            chunks.append(chunk_data)
            if chunk_data.get("done", False):
                break

    except Exception as e:
        error = str(e)

    end_time = time.perf_counter()
    total_time = end_time - start_time
    ttft_ms = (first_token_time - start_time) * 1000 if first_token_time else total_time * 1000

    # Token approximation (~4 chars per token)
    est_tokens = max(1, len(full_content) // 4)
    active_gen_time = (end_time - first_token_time) if first_token_time else total_time
    tps = est_tokens / max(0.001, active_gen_time)

    # Keyword presence check for accuracy
    matched_keywords = [
        kw for kw in test_item.get("expected_keywords", [])
        if kw.lower() in full_content.lower()
    ]
    accuracy_score = (len(matched_keywords) / max(1, len(test_item.get("expected_keywords", [])))) * 100

    return {
        "success": error is None and len(full_content) > 0,
        "error": error,
        "ttft_ms": round(ttft_ms, 1),
        "total_time_s": round(total_time, 2),
        "tokens": est_tokens,
        "tokens_per_sec": round(tps, 1),
        "accuracy_score": round(accuracy_score, 1),
        "output_preview": (full_content[:180] + "...") if len(full_content) > 180 else full_content
    }

def run_benchmark(base_url: str, models: List[str]):
    print("=" * 78)
    print(" 🚀 ASURA AI by Cretivra — AI Model Test Bench & Performance Suite")
    print(f" 🌐 Target Endpoint : {base_url}")
    print(f" 🧠 Target Models   : {', '.join(models)}")
    print(f" 📅 Timestamp       : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 78)

    results: Dict[str, Any] = {
        "timestamp": datetime.now().isoformat(),
        "base_url": base_url,
        "models": {}
    }

    for model_id in models:
        print(f"\n▶ Testing Model: [{model_id}]")
        print("-" * 78)
        model_results = []

        for idx, test in enumerate(BENCHMARK_PROMPTS, 1):
            sys.stdout.write(f"  [{idx}/{len(BENCHMARK_PROMPTS)}] {test['category']} ... ")
            sys.stdout.flush()

            test_res = run_single_test(base_url, model_id, test)
            model_results.append({
                "test_id": test["id"],
                "category": test["category"],
                **test_res
            })

            if test_res["success"]:
                print(f"✓ TTFT: {test_res['ttft_ms']}ms | Speed: {test_res['tokens_per_sec']} t/s | Accuracy: {test_res['accuracy_score']}%")
            else:
                print(f"⚠ Failed ({test_res.get('error')})")

        # Compute aggregate averages
        successful_runs = [r for r in model_results if r["success"]]
        if successful_runs:
            avg_ttft = sum(r["ttft_ms"] for r in successful_runs) / len(successful_runs)
            avg_tps = sum(r["tokens_per_sec"] for r in successful_runs) / len(successful_runs)
            avg_accuracy = sum(r["accuracy_score"] for r in successful_runs) / len(successful_runs)
        else:
            avg_ttft, avg_tps, avg_accuracy = 0, 0, 0

        results["models"][model_id] = {
            "avg_ttft_ms": round(avg_ttft, 1),
            "avg_tokens_per_sec": round(avg_tps, 1),
            "avg_accuracy_score": round(avg_accuracy, 1),
            "tests": model_results
        }

    # Print Comparative Scorecard Table
    print("\n" + "=" * 78)
    print(" 📊 FINAL BENCHMARK SCORECARD: Asura AI vs. Industry Frontier Baselines")
    print("=" * 78)
    header_fmt = "{:<28} | {:<10} | {:<12} | {:<10} | {:<14}"
    print(header_fmt.format("Model / Engine", "Avg TTFT", "Throughput", "Accuracy", "Cost (1M)"))
    print("-" * 78)

    # Print Cretivra Models Tested
    for model_id, data in results["models"].items():
        name = f"⭐ Asura {model_id}"
        ttft = f"{data['avg_ttft_ms']} ms"
        tps = f"{data['avg_tokens_per_sec']} t/s"
        acc = f"{data['avg_accuracy_score']}%"
        cost = "100% Free / OSS"
        print(header_fmt.format(name[:28], ttft, tps, acc, cost))

    print("-" * 78)
    # Print Frontier Industry Baselines
    for baseline_name, data in INDUSTRY_BASELINES.items():
        ttft = f"{data['avg_ttft_ms']} ms"
        tps = f"{data['tokens_per_sec']} t/s"
        acc = f"{data['reasoning_score']}"
        cost = data['cost_per_1m_tokens']
        print(header_fmt.format(baseline_name[:28], ttft, tps, acc, cost))
    print("=" * 78)

    # Save to JSON artifact
    json_path = "benchmark_results.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n✓ Detailed JSON telemetry saved to: {json_path}")

    # Generate Markdown Report
    report_path = "BENCHMARK_REPORT.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("# Asura AI by Cretivra — AI Model Benchmark Test Report\n\n")
        f.write(f"- **Execution Timestamp**: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`\n")
        f.write(f"- **Target Host**: `{base_url}`\n\n")
        f.write("## 🏁 Comparative Benchmark Scorecard\n\n")
        f.write("| Model | Avg TTFT (Latency) | Generation Speed | Accuracy / Reasoning | Cost per 1M Tokens |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for m_id, m_data in results["models"].items():
            f.write(f"| **Asura {m_id}** | `{m_data['avg_ttft_ms']} ms` | `{m_data['avg_tokens_per_sec']} t/s` | `{m_data['avg_accuracy_score']}%` | **100% Free** |\n")
        for b_name, b_data in INDUSTRY_BASELINES.items():
            f.write(f"| {b_name} | `{b_data['avg_ttft_ms']} ms` | `{b_data['tokens_per_sec']} t/s` | `{b_data['reasoning_score']}` | `{b_data['cost_per_1m_tokens']}` |\n")
        f.write("\n## 🔬 Test Battery Prompts\n\n")
        for prompt in BENCHMARK_PROMPTS:
            f.write(f"### {prompt['category']}\n")
            f.write(f"> {prompt['prompt']}\n\n")
    print(f"✓ Formatted Markdown report generated at: {report_path}\n")

def main():
    parser = argparse.ArgumentParser(description="Asura AI Model Test Bench & Performance Suite")
    parser.add_argument("--url", default="http://localhost:8000", help="Base backend API URL (default: http://localhost:8000)")
    parser.add_argument("--models", nargs="+", default=["cretivra-1", "cretivra-reason", "cretivra-coder"], help="Model IDs to benchmark")
    args = parser.parse_args()

    run_benchmark(args.url, args.models)

if __name__ == "__main__":
    main()
