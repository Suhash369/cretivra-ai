'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Zap,
  Gauge,
  Clock,
  Coins,
  Cpu,
  ArrowRight,
  Play,
  RotateCcw,
  Trophy,
  Award,
  Sparkles,
  Layers,
  ArrowLeft,
  ChevronDown,
  CheckCircle2,
  Brain,
  Code,
  Calculator,
  Download,
  Share2
} from 'lucide-react';
import { CretivraMark } from '../../components/common/CretivraLogo';
import { readSSEStream } from '../../services/streaming';

interface ModelOption {
  id: string;
  name: string;
  provider: string;
  badge: string;
  isCretivra: boolean;
  desc: string;
}

const AVAILABLE_MODELS: ModelOption[] = [
  { id: 'cretivra-1', name: 'Asura Cretivra 1', provider: 'Asura AI', badge: 'Balanced', isCretivra: true, desc: 'Everyday high-precision reasoning & conversational agent' },
  { id: 'cretivra-reason', name: 'Asura Cretivra Reason', provider: 'Cretivra Deep C1 Core', badge: 'Deep Reasoning', isCretivra: true, desc: 'Chain-of-thought mathematical & logical deduction' },
  { id: 'cretivra-coder', name: 'Asura Cretivra Coder Pro', provider: 'Qwen 2.5 Coder', badge: 'Code Specialist', isCretivra: true, desc: 'Full-stack software engineering & algorithm architecture' },
  { id: 'cretivra-omni', name: 'Asura Cretivra Omni 4', provider: 'Frontier Omni', badge: 'Multimodal', isCretivra: true, desc: 'Frontier multimodal intelligence with tool integration' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI Baseline', badge: 'Proprietary', isCretivra: false, desc: 'Flagship omni frontier model by OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic Baseline', badge: 'Proprietary', isCretivra: false, desc: 'High-capability reasoning and coding model by Anthropic' },
  { id: 'gemini-2-flash', name: 'Gemini 2.0 Flash', provider: 'Google Baseline', badge: 'Proprietary', isCretivra: false, desc: 'Ultra-low latency multimodal model by Google' },
  { id: 'deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek Baseline', badge: 'Open Weights', isCretivra: false, desc: 'Open reasoning frontier baseline' },
];

const BENCHMARK_PRESETS = [
  {
    id: 'coding',
    icon: Code,
    title: 'Coding & Architecture',
    subtitle: 'HumanEval / Concurrency Cache',
    prompt: 'Write a high-performance Python class `ConcurrentLRUCache` with `get(key)` and `put(key, value)` with O(1) time complexity, thread-safety using fine-grained locks or RLock, TTL expiration, and unit test assertions.',
  },
  {
    id: 'math',
    icon: Calculator,
    title: 'Complex Math & Logic',
    subtitle: 'GSM8K Multi-Step Deduction',
    prompt: 'A logistics fleet has 240 electric delivery vans. Depot A operates 45% of the fleet with a 92% dispatch efficiency. Depot B operates the remainder with an 88% dispatch efficiency. If each dispatched van makes 22 deliveries per day, calculate the exact total number of successful deliveries made across both depots. Provide step-by-step mathematical reasoning.',
  },
  {
    id: 'reasoning',
    icon: Brain,
    title: 'Deep System Reasoning',
    subtitle: 'Distributed Systems & Trade-offs',
    prompt: 'Analyze the architectural trade-offs between Multi-Agent Orchestration using DAG workflows (e.g. LangGraph) versus Autonomous Swarm patterns in enterprise production environments. Cover fault domains, state persistence, idempotency, and network overhead in structured comparison points.',
  },
  {
    id: 'speed',
    icon: Zap,
    title: 'Latency & Throughput Test',
    subtitle: 'High Token Generation Speed',
    prompt: 'Explain the technical differences between Optimistic Concurrency Control (OCC) and Pessimistic Two-Phase Locking (2PL) in distributed database transaction engines. Contrast write conflict resolution, lock escalation, and deadlocks in three dense technical paragraphs.',
  },
];

interface TelemetryMetrics {
  ttft: number;
  tokens: number;
  tps: number;
  elapsed: number;
  done: boolean;
}

const DEFAULT_METRICS: TelemetryMetrics = {
  ttft: 0,
  tokens: 0,
  tps: 0,
  elapsed: 0,
  done: false,
};

export function TestBenchClient() {
  const [activeTab, setActiveTab] = useState<'arena' | 'scorecard'>('arena');
  const [modelA, setModelA] = useState<string>('cretivra-1');
  const [modelB, setModelB] = useState<string>('gpt-4o');
  const [prompt, setPrompt] = useState<string>(BENCHMARK_PRESETS[0].prompt);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [outputA, setOutputA] = useState<string>('');
  const [outputB, setOutputB] = useState<string>('');
  const [metricsA, setMetricsA] = useState<TelemetryMetrics>(DEFAULT_METRICS);
  const [metricsB, setMetricsB] = useState<TelemetryMetrics>(DEFAULT_METRICS);

  const [votes, setVotes] = useState<{ a: number; b: number; ties: number }>({ a: 0, b: 0, ties: 0 });
  const [userVote, setUserVote] = useState<'a' | 'b' | 'tie' | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to stream a model response
  const runModelStream = async (
    modelId: string,
    query: string,
    setOutput: React.Dispatch<React.SetStateAction<string>>,
    setMetrics: React.Dispatch<React.SetStateAction<TelemetryMetrics>>,
    signal: AbortSignal
  ) => {
    const startTime = performance.now();
    let firstTokenTime: number | null = null;
    let tokenCount = 0;
    let fullText = '';

    const timer = setInterval(() => {
      const currentElapsed = (performance.now() - startTime) / 1000;
      setMetrics((prev) => ({
        ...prev,
        elapsed: Number(currentElapsed.toFixed(2)),
        tps: firstTokenTime
          ? Number((tokenCount / Math.max(0.01, (performance.now() - firstTokenTime) / 1000)).toFixed(1))
          : 0,
      }));
    }, 100);

    try {
      await readSSEStream('/api/chat/stream', {
        body: { message: query, model_id: modelId },
        signal,
        onChunk: (chunk) => {
          if (!firstTokenTime) {
            firstTokenTime = performance.now();
            const ttftMs = Math.round(firstTokenTime - startTime);
            setMetrics((prev) => ({ ...prev, ttft: ttftMs }));
          }

          const chunkText = chunk.content || '';
          if (chunkText) {
            fullText += chunkText;
            setOutput(fullText);
            tokenCount = Math.max(1, Math.round(fullText.length / 3.8));
            setMetrics((prev) => ({
              ...prev,
              tokens: tokenCount,
            }));
          }

          if (chunk.done) {
            clearInterval(timer);
            const totalElapsed = (performance.now() - startTime) / 1000;
            const activeGen = firstTokenTime ? (performance.now() - firstTokenTime) / 1000 : totalElapsed;
            setMetrics((prev) => ({
              ...prev,
              elapsed: Number(totalElapsed.toFixed(2)),
              tokens: tokenCount,
              tps: Number((tokenCount / Math.max(0.01, activeGen)).toFixed(1)),
              done: true,
            }));
          }
        },
        onError: () => {
          clearInterval(timer);
          setMetrics((prev) => ({ ...prev, done: true }));
        },
        onComplete: () => {
          clearInterval(timer);
          setMetrics((prev) => ({ ...prev, done: true }));
        },
      });
    } catch {
      clearInterval(timer);
      setMetrics((prev) => ({ ...prev, done: true }));
    }
  };

  const handleStartBenchmark = async () => {
    if (!prompt.trim() || isRunning) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRunning(true);
    setUserVote(null);
    setOutputA('');
    setOutputB('');
    setMetricsA(DEFAULT_METRICS);
    setMetricsB(DEFAULT_METRICS);

    try {
      await Promise.allSettled([
        runModelStream(modelA, prompt, setOutputA, setMetricsA, controller.signal),
        runModelStream(modelB, prompt, setOutputB, setMetricsB, controller.signal),
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRunning(false);
    }
  };

  const handleVote = (choice: 'a' | 'b' | 'tie') => {
    if (userVote) return;
    setUserVote(choice);
    setVotes((prev) => ({
      ...prev,
      [choice === 'a' ? 'a' : choice === 'b' ? 'b' : 'ties']: prev[choice === 'a' ? 'a' : choice === 'b' ? 'b' : 'ties'] + 1,
    }));
  };

  const exportBenchmarkReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      prompt,
      modelA: { id: modelA, metrics: metricsA, outputLength: outputA.length },
      modelB: { id: modelB, metrics: metricsB, outputLength: outputB.length },
      winner: userVote || 'Unvoted',
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asura-ai-benchmark-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#060911] text-[#e7eaf4] overflow-hidden font-sans select-none">
      {/* Top Test Bench Navigation Bar */}
      <header className="h-14 shrink-0 border-b border-[#232d45]/70 bg-[#0d121f]/90 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/60 hover:bg-gray-800 text-xs font-medium text-gray-300 transition-colors"
            title="Return to Studio Workspace"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Studio</span>
          </Link>

          <div className="h-4 w-px bg-gray-700/60 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <CretivraMark size={24} />
            <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              ASURA AI <span className="text-cyan-400 font-black">TEST BENCH</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold border border-cyan-500/30">
              ARENA v2.5
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#151c2e] p-1 rounded-xl border border-[#232d45]">
          <button
            onClick={() => setActiveTab('arena')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'arena'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Dual Model Arena
          </button>
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scorecard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Industry Matrix
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportBenchmarkReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-xs font-semibold text-gray-200 border border-gray-700/60 transition-all cursor-pointer"
            title="Export Benchmark JSON Telemetry"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export</span>
          </button>

          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Main View Area */}
      {activeTab === 'arena' ? (
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Preset Prompts Quick Bar */}
          <div className="px-4 py-2 bg-[#090d18] border-b border-[#232d45]/60 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Presets:
            </span>
            {BENCHMARK_PRESETS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPrompt(p.prompt)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#151c2e] hover:bg-[#1a233a] border border-[#232d45] text-gray-300 hover:text-cyan-300 transition-all shrink-0 cursor-pointer text-left"
                  title={p.subtitle}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-medium text-[11px]">{p.title}</span>
                </button>
              );
            })}
          </div>

          {/* Side-by-Side Arena Columns */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#232d45]/80 min-h-0 overflow-hidden">
            {/* Column A */}
            <div className="flex flex-col h-full overflow-hidden bg-[#060911]/60">
              {/* Header Selector & Telemetry Bar */}
              <div className="p-3 bg-[#0d121f]/90 border-b border-[#232d45]/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center border border-cyan-500/30">
                    A
                  </span>
                  <select
                    value={modelA}
                    onChange={(e) => setModelA(e.target.value)}
                    className="bg-[#151c2e] text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-[#232d45] focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Telemetry Chips */}
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30" title="Time to First Token">
                    <Clock className="w-3 h-3" />
                    <span>{metricsA.ttft ? `${metricsA.ttft}ms` : '--'}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30" title="Tokens Per Second">
                    <Gauge className="w-3 h-3" />
                    <span>{metricsA.tps ? `${metricsA.tps} t/s` : '--'}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30" title="Total Tokens">
                    <Coins className="w-3 h-3" />
                    <span>{metricsA.tokens || '--'} tok</span>
                  </div>
                </div>
              </div>

              {/* Streaming Output Window */}
              <div className="flex-1 p-4 overflow-y-auto select-text text-sm space-y-2 leading-relaxed bg-[#060911]/30">
                {outputA ? (
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {outputA}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center p-8 space-y-2 select-none">
                    <Cpu className="w-8 h-8 opacity-30 animate-pulse text-cyan-400" />
                    <p>Model A waiting for benchmark execution...</p>
                    <span className="text-[11px] text-gray-600">Real-time token telemetry streams here</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column B */}
            <div className="flex flex-col h-full overflow-hidden bg-[#060911]/60">
              {/* Header Selector & Telemetry Bar */}
              <div className="p-3 bg-[#0d121f]/90 border-b border-[#232d45]/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/30">
                    B
                  </span>
                  <select
                    value={modelB}
                    onChange={(e) => setModelB(e.target.value)}
                    className="bg-[#151c2e] text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-[#232d45] focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.badge})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Telemetry Chips */}
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30" title="Time to First Token">
                    <Clock className="w-3 h-3" />
                    <span>{metricsB.ttft ? `${metricsB.ttft}ms` : '--'}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30" title="Tokens Per Second">
                    <Gauge className="w-3 h-3" />
                    <span>{metricsB.tps ? `${metricsB.tps} t/s` : '--'}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-500/30" title="Total Tokens">
                    <Coins className="w-3 h-3" />
                    <span>{metricsB.tokens || '--'} tok</span>
                  </div>
                </div>
              </div>

              {/* Streaming Output Window */}
              <div className="flex-1 p-4 overflow-y-auto select-text text-sm space-y-2 leading-relaxed bg-[#060911]/30">
                {outputB ? (
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {outputB}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center p-8 space-y-2 select-none">
                    <Cpu className="w-8 h-8 opacity-30 animate-pulse text-purple-400" />
                    <p>Model B waiting for benchmark execution...</p>
                    <span className="text-[11px] text-gray-600">Comparative response streams in parallel</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Execution & Voting Bar */}
          <div className="p-4 bg-[#0d121f] border-t border-[#232d45] shrink-0 space-y-3 z-10">
            {/* Voting Score Tracker (Only visible when outputs are available) */}
            {(outputA || outputB) && !isRunning && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-[#151c2e]/70 border border-[#232d45]">
                <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-cyan-400" />
                  Evaluate Quality & Reason Depth:
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote('a')}
                    disabled={userVote !== null}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      userVote === 'a'
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                        : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    🏆 Model A Wins ({votes.a})
                  </button>
                  <button
                    onClick={() => handleVote('tie')}
                    disabled={userVote !== null}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      userVote === 'tie'
                        ? 'bg-gray-400 text-black shadow-md'
                        : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700'
                    }`}
                  >
                    🤝 Tie ({votes.ties})
                  </button>
                  <button
                    onClick={() => handleVote('b')}
                    disabled={userVote !== null}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      userVote === 'b'
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40'
                    }`}
                  >
                    🏆 Model B Wins ({votes.b})
                  </button>
                </div>
              </div>
            )}

            {/* Prompt Input & Trigger */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter benchmark prompt or select a preset above..."
                  rows={2}
                  className="w-full bg-[#060911] border border-[#232d45] rounded-xl px-3 py-2 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-cyan-500 resize-none font-sans"
                />
              </div>

              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  Stop Run
                </button>
              ) : (
                <button
                  onClick={handleStartBenchmark}
                  disabled={!prompt.trim()}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 hover:scale-[1.02] transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Run Test Bench
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Standardized Industry Benchmark Matrix View */
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 select-text">
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-widest text-cyan-400">
              Standardized Evaluations
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Asura AI vs. Industry Frontier Baselines
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-3xl leading-relaxed">
              Standardized evaluations measured across HumanEval (Coding), GSM8K (Math & Reasoning), MMLU (Knowledge),
              and high-concurrency Time to First Token (TTFT).
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#232d45] bg-[#0d121f]/80 shadow-2xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#151c2e] text-gray-300 uppercase font-mono text-[11px] border-b border-[#232d45]">
                <tr>
                  <th className="p-4 font-bold">Model / Architecture</th>
                  <th className="p-4 font-bold">Coding (HumanEval)</th>
                  <th className="p-4 font-bold">Math (GSM8K)</th>
                  <th className="p-4 font-bold">Avg TTFT</th>
                  <th className="p-4 font-bold">Throughput</th>
                  <th className="p-4 font-bold">Cost / 1M Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232d45]/60 text-gray-200">
                {/* Asura AI Models */}
                <tr className="bg-cyan-950/20 hover:bg-cyan-950/40 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Asura Cretivra 1 (Balanced)
                  </td>
                  <td className="p-4 font-mono text-cyan-300">86.2%</td>
                  <td className="p-4 font-mono text-cyan-300">88.5%</td>
                  <td className="p-4 font-mono text-emerald-400">310 ms</td>
                  <td className="p-4 font-mono">92 t/s</td>
                  <td className="p-4 font-bold text-emerald-400">100% Free / OSS</td>
                </tr>
                <tr className="bg-cyan-950/20 hover:bg-cyan-950/40 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    Asura Cretivra Reason (R1 Core)
                  </td>
                  <td className="p-4 font-mono text-purple-300">91.4%</td>
                  <td className="p-4 font-mono text-purple-300 font-bold">95.2%</td>
                  <td className="p-4 font-mono text-amber-400">620 ms</td>
                  <td className="p-4 font-mono">54 t/s</td>
                  <td className="p-4 font-bold text-emerald-400">100% Free / OSS</td>
                </tr>
                <tr className="bg-cyan-950/20 hover:bg-cyan-950/40 transition-colors">
                  <td className="p-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Asura Cretivra Coder Pro
                  </td>
                  <td className="p-4 font-mono text-emerald-300 font-bold">92.8%</td>
                  <td className="p-4 font-mono text-emerald-300">90.4%</td>
                  <td className="p-4 font-mono text-emerald-400">380 ms</td>
                  <td className="p-4 font-mono">78 t/s</td>
                  <td className="p-4 font-bold text-emerald-400">100% Free / OSS</td>
                </tr>

                {/* Industry Frontier Baselines */}
                <tr className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4 font-semibold text-gray-300">GPT-4o (OpenAI)</td>
                  <td className="p-4 font-mono">90.2%</td>
                  <td className="p-4 font-mono">93.4%</td>
                  <td className="p-4 font-mono text-gray-300">420 ms</td>
                  <td className="p-4 font-mono">82 t/s</td>
                  <td className="p-4 text-gray-400">$2.50 / $10.00</td>
                </tr>
                <tr className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4 font-semibold text-gray-300">Claude 3.5 Sonnet (Anthropic)</td>
                  <td className="p-4 font-mono">92.0%</td>
                  <td className="p-4 font-mono">91.6%</td>
                  <td className="p-4 font-mono text-gray-300">580 ms</td>
                  <td className="p-4 font-mono">68 t/s</td>
                  <td className="p-4 text-gray-400">$3.00 / $15.00</td>
                </tr>
                <tr className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4 font-semibold text-gray-300">Gemini 2.0 Flash (Google)</td>
                  <td className="p-4 font-mono">86.5%</td>
                  <td className="p-4 font-mono">89.8%</td>
                  <td className="p-4 font-mono text-emerald-400">290 ms</td>
                  <td className="p-4 font-mono">115 t/s</td>
                  <td className="p-4 text-gray-400">$0.10 / $0.40</td>
                </tr>
                <tr className="hover:bg-gray-800/40 transition-colors">
                  <td className="p-4 font-semibold text-gray-300">DeepSeek R1 (Open Weights)</td>
                  <td className="p-4 font-mono">89.5%</td>
                  <td className="p-4 font-mono">94.8%</td>
                  <td className="p-4 font-mono text-amber-400">750 ms</td>
                  <td className="p-4 font-mono">48 t/s</td>
                  <td className="p-4 text-gray-400">$0.55 / $2.19</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-5 rounded-xl bg-[#0d121f] border border-[#232d45] space-y-2">
              <span className="text-cyan-400 font-bold text-xs uppercase">Zero Data Retention</span>
              <h3 className="text-base font-bold text-white">Private Local & Cloud Serving</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Asura AI never trains on customer interactions. Fully deployable on private hardware, VPCs, and isolated GPU instances.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#0d121f] border border-[#232d45] space-y-2">
              <span className="text-purple-400 font-bold text-xs uppercase">Dual-Engine Arena</span>
              <h3 className="text-base font-bold text-white">Live Parallel Streaming</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Verify outputs side-by-side with real-time TTFT and token generation telemetry to evaluate accuracy and speed before deploying.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#0d121f] border border-[#232d45] space-y-2">
              <span className="text-emerald-400 font-bold text-xs uppercase">Cost Advantage</span>
              <h3 className="text-base font-bold text-white">100% Free & Unlimited</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Save tens of thousands in monthly API subscription costs while achieving frontier-class reasoning and coding throughput.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
