import React, { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Cpu,
  Brain,
  FileText,
  Download,
  Palette,
  CheckCircle2,
  Layers,
  ArrowRight,
  Zap,
  Terminal,
  Eye,
  ShieldCheck,
  Search,
} from "lucide-react";
import { CretivraMark } from "../common/CretivraLogo";

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string, modelId?: string) => void;
}

interface TourStep {
  id: number;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  description: string;
  tip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    tag: "Welcome",
    tagColor: "from-cyan-500 to-blue-500",
    title: "Welcome to Asura AI",
    subtitle: "Frontier Intelligence • Complete Privacy",
    description:
      "Asura AI by Cretivra brings state-of-the-art AI reasoning, document intelligence, and creative generation directly to your browser. Let's take a 60-second interactive tour of what you can accomplish.",
    tip: "Use Left/Right arrow keys on your keyboard to navigate this tour anytime.",
  },
  {
    id: 2,
    tag: "Intelligence Tiers",
    tagColor: "from-blue-500 to-purple-500",
    title: "Select Your Model Tier",
    subtitle: "Unified intelligence optimized for every workflow",
    description:
      "Choose from dedicated Cretivra model tiers right from the top navigation bar. Each model is specialized for different speeds and problem complexities.",
    tip: "Click on any model card below to inspect its specialized capabilities.",
  },
  {
    id: 3,
    tag: "Deep Reasoning",
    tagColor: "from-purple-500 to-pink-500",
    title: "Chain-of-Thought Deep Reasoning",
    subtitle: "Watch the AI formulate structured logic before answering",
    description:
      "For complex logic, mathematical proofs, and code architecture, select Cretivra Reason. It outputs a real-time thinking collapsible block showing its step-by-step cognitive deduction before delivering the final answer.",
    tip: "Click the 'Thinking process' toggle on any response to inspect internal reasoning.",
  },
  {
    id: 4,
    tag: "Multimodal Intelligence",
    tagColor: "from-emerald-500 to-teal-500",
    title: "Document Ingestion & Vision",
    subtitle: "Drag & drop files, datasets, and images directly into chat",
    description:
      "Attach PDFs, Word docs, CSV spreadsheets, or screenshots. Asura AI parses tables, summarizes hundred-page documents, and performs deep multimodal analysis with full context retention.",
    tip: "Toggle the 'Search' button below the composer to fetch verified live web citations.",
  },
  {
    id: 5,
    tag: "Document Synthesis",
    tagColor: "from-indigo-500 to-blue-600",
    title: "1-Click Executive PDF & Slide Export",
    subtitle: "Transform conversations into publication-grade documents",
    description:
      "Ask 'generate a PDF report on this' or click the dedicated PDF icon underneath any assistant response to download a beautifully formatted multi-page PDF with running headers, footers, and styled data tables.",
    tip: "Need presentation slides? Prompt 'generate a presentation on...' for a downloadable PowerPoint deck.",
  },
  {
    id: 6,
    tag: "Image Studio",
    tagColor: "from-fuchsia-500 to-purple-600",
    title: "AI Image Generation Studio",
    subtitle: "Photorealistic art & creative diffusion in multiple aspect ratios",
    description:
      "Open the dedicated Image Studio in the top bar to synthesize high-resolution imagery using FLUX.1 Art and SDXL Studio. Choose 16:9 widescreen, 1:1 square, or 9:16 portrait with 1-click prompt enhancement.",
    tip: "You can also ask directly in chat: 'generate an image of a futuristic laboratory'.",
  },
  {
    id: 7,
    tag: "Launchpad",
    tagColor: "from-cyan-400 via-purple-500 to-pink-500",
    title: "Ready to Explore!",
    subtitle: "Select a prompt below to launch your first session",
    description:
      "You have full access to frontier intelligence with zero setup. Click any starter prompt below to populate the chat composer and start exploring immediately.",
    tip: "You can reopen this guide anytime by clicking the 'AI Guide' button in the top navigation bar.",
  },
];

export function OnboardingTourModal({
  isOpen,
  onClose,
  onSelectPrompt,
}: OnboardingTourModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModelDemo, setSelectedModelDemo] = useState("cretivra-1");
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (currentStep < TOUR_STEPS.length) {
          setCurrentStep((prev) => prev + 1);
        } else {
          handleFinish();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 1) {
          setCurrentStep((prev) => prev - 1);
        }
      } else if (e.key === "Escape") {
        handleFinish();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep - 1];

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem("asura_onboarding_completed", "true");
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleQuickPrompt = (promptText: string, modelId: string = "cretivra-1") => {
    handleFinish();
    if (onSelectPrompt) {
      onSelectPrompt(promptText, modelId);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[#0a0f1d] border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800/80 z-10">
          <div className="flex items-center gap-2.5">
            <CretivraMark size={24} />
            <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
              Asura AI Guided Tour
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              Step {currentStep} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={handleFinish}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Close tour (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/60 h-1">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 z-10">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 mb-3">
            <Sparkles size={11} className="text-cyan-400" />
            {step.tag}
          </div>

          <h2
            id="tour-modal-title"
            className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent mb-1"
          >
            {step.title}
          </h2>
          <p className="text-sm font-medium text-cyan-400/90 mb-4">
            {step.subtitle}
          </p>

          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {step.description}
          </p>

          {/* STEP-SPECIFIC INTERACTIVE GRAPHICS */}

          {/* Step 1: Welcome & Holographic Hero */}
          {currentStep === 1 && (
            <div className="relative rounded-2xl bg-gradient-to-b from-[#10172b] to-[#0d1222] border border-cyan-500/20 p-6 overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-transparent border border-cyan-500/40 flex items-center justify-center animate-pulse-ring">
                  <CretivraMark size={44} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md mt-2">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <Cpu size={18} className="mx-auto text-cyan-400 mb-1" />
                  <div className="text-[11px] font-semibold text-slate-200">
                    Frontier Core
                  </div>
                  <div className="text-[9px] text-slate-400">Zero telemetry</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <Brain size={18} className="mx-auto text-purple-400 mb-1" />
                  <div className="text-[11px] font-semibold text-slate-200">
                    Deep Reason
                  </div>
                  <div className="text-[9px] text-slate-400">Chain-of-thought</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <FileText size={18} className="mx-auto text-emerald-400 mb-1" />
                  <div className="text-[11px] font-semibold text-slate-200">
                    1-Click PDF
                  </div>
                  <div className="text-[9px] text-slate-400">Executive export</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Model Selector Preview */}
          {currentStep === 2 && (
            <div className="space-y-2.5">
              {[
                {
                  id: "cretivra-1",
                  name: "Cretivra 1",
                  badge: "Balanced Everyday",
                  desc: "Ideal for research, long-form writing, conversational flow, and general synthesis.",
                  icon: Cpu,
                  color: "text-cyan-400",
                  border: "border-cyan-500/40",
                  bg: "bg-cyan-500/10",
                },
                {
                  id: "cretivra-reason",
                  name: "Cretivra Reason",
                  badge: "Chain-of-Thought Logic",
                  desc: "Specialized for algorithmic math, logical proofs, and multi-step deduction.",
                  icon: Brain,
                  color: "text-purple-400",
                  border: "border-purple-500/40",
                  bg: "bg-purple-500/10",
                },
                {
                  id: "cretivra-coder",
                  name: "Cretivra Coder Pro",
                  badge: "Full-Stack Software",
                  desc: "Engineered for clean code generation, refactoring, systems architecture, and debugging.",
                  icon: Terminal,
                  color: "text-emerald-400",
                  border: "border-emerald-500/40",
                  bg: "bg-emerald-500/10",
                },
                {
                  id: "cretivra-omni",
                  name: "Cretivra Omni 4",
                  badge: "Multimodal Agent",
                  desc: "Handles vision analysis, charts, complex multi-document reasoning, and tools.",
                  icon: Eye,
                  color: "text-pink-400",
                  border: "border-pink-500/40",
                  bg: "bg-pink-500/10",
                },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = selectedModelDemo === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModelDemo(m.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? `${m.bg} ${m.border} shadow-lg shadow-cyan-950/30 scale-[1.01]`
                        : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-slate-950/60 ${m.color}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">
                            {m.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Step 3: Deep Reasoning Simulation */}
          {currentStep === 3 && (
            <div className="rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#0a0f1d] border border-purple-500/30 p-4 space-y-3 font-sans">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                <Brain size={14} className="text-purple-400 animate-pulse" />
                Live Reasoning In Action
              </div>

              {/* Collapsible Thinking Box */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-purple-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    ✦ Thinking process (analyzed in 1.8s)
                  </span>
                  <span className="text-[10px] text-purple-400/80">Step 1 to 4</span>
                </div>
                <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                  1. Parsing mathematical theorem and constraints...
                  <br />
                  2. Evaluating edge cases for asymptotic convergence...
                  <br />
                  3. Formulating rigorous proof and structured solution.
                </p>
              </div>

              {/* Streaming Output Simulation */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
                <span className="font-semibold text-cyan-300">
                  Proof Formulation:
                </span>{" "}
                By applying induction across discrete state spaces, the invariant holds
                for all positive integers n ≥ 1.
                <span className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1.5 align-middle animate-pulse" />
              </div>
            </div>
          )}

          {/* Step 4: Multimodal File Ingestion */}
          {currentStep === 4 && (
            <div className="rounded-2xl bg-[#0f172a] border border-emerald-500/30 p-5 space-y-4">
              <div className="relative border-2 border-dashed border-emerald-500/40 rounded-xl p-5 text-center bg-emerald-950/10 overflow-hidden">
                {/* Scanning Beam Animation */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-scan-beam pointer-events-none" />

                <FileText size={32} className="mx-auto text-emerald-400 mb-2 animate-float-slow" />
                <div className="text-sm font-semibold text-slate-200">
                  Drop PDFs, Documents, or Images Here
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Automatic OCR, table parsing, chart reading, and text extraction
                </p>

                <div className="flex items-center justify-center gap-2 mt-3">
                  {["PDF", "DOCX", "CSV", "PNG", "TXT"].map((ext) => (
                    <span
                      key={ext}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    >
                      .{ext}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
                <Search size={16} className="text-cyan-400 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-100">
                    Live Web Search:
                  </span>{" "}
                  Click the <strong>Search</strong> pill under the chat composer to verify
                  claims with real-time web citations.
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Executive PDF & PPTX Presentation */}
          {currentStep === 5 && (
            <div className="rounded-2xl bg-[#0e1628] border border-indigo-500/30 p-5 space-y-4">
              <div className="rounded-xl bg-slate-950 border border-indigo-500/30 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                  <span className="text-[10px] font-mono tracking-wider text-indigo-400 uppercase">
                    ASURA AI | Executive PDF Synthesis
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Page 1 of 3</span>
                </div>

                <div className="space-y-1.5">
                  <div className="h-3 w-2/3 bg-slate-200 rounded font-bold" />
                  <div className="h-2 w-full bg-slate-700/60 rounded" />
                  <div className="h-2 w-4/5 bg-slate-700/60 rounded" />
                </div>

                {/* Simulated Table */}
                <div className="border border-slate-800 rounded-lg overflow-hidden text-[10px]">
                  <div className="grid grid-cols-3 bg-indigo-950/40 p-1.5 font-semibold text-indigo-200">
                    <div>Metric</div>
                    <div>Value</div>
                    <div>Growth</div>
                  </div>
                  <div className="grid grid-cols-3 p-1.5 bg-slate-900/40 text-slate-300 border-t border-slate-800">
                    <div>Inference Latency</div>
                    <div>18ms</div>
                    <div className="text-emerald-400">+42%</div>
                  </div>
                </div>

                {/* 1-Click Download Pill */}
                <div className="flex items-center justify-between pt-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-indigo-950/50">
                    <Download size={13} />
                    <span>Download Report (.pdf)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Running header & footer included</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Click the <strong>PDF</strong> button in the action toolbar under any AI response to
                convert that conversation into a publication-grade PDF file instantly.
              </p>
            </div>
          )}

          {/* Step 6: Image Studio */}
          {currentStep === 6 && (
            <div className="rounded-2xl bg-gradient-to-b from-[#151025] to-[#0c0a18] border border-fuchsia-500/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-fuchsia-300">
                  <Palette size={14} className="text-fuchsia-400" />
                  Cretivra FLUX.1 & SDXL Diffusion Engine
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <span>16:9</span> • <span>1:1</span> • <span>9:16</span>
                </div>
              </div>

              {/* Visual Showcase Card */}
              <div className="relative h-36 rounded-xl bg-gradient-to-tr from-purple-900/40 via-indigo-950 to-slate-900 border border-fuchsia-500/30 overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.2),transparent_60%)]" />
                <div className="text-center p-4 z-10">
                  <Sparkles size={24} className="mx-auto text-fuchsia-400 mb-1.5 animate-spin" style={{ animationDuration: '8s' }} />
                  <div className="text-xs font-bold text-white tracking-wide">
                    Instant AI Visual Synthesis
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 max-w-sm">
                    Generate photorealistic renders, 3D CGI, anime illustrations, and digital art.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <Zap size={14} className="text-amber-400 shrink-0" />
                <span>
                  Click the <strong>Image Studio</strong> button in the top navigation bar anytime to create custom graphics.
                </span>
              </div>
            </div>
          )}

          {/* Step 7: Launchpad & Quick Prompts */}
          {currentStep === 7 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                Click any starter prompt to launch:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    title: "2026 AI Frontier Report",
                    prompt:
                      "Summarize the most significant breakthroughs in autonomous AI and frontier intelligence for 2026, formatted as a structured report.",
                    model: "cretivra-1",
                    tag: "Research",
                    color: "text-cyan-400",
                  },
                  {
                    title: "Deep Logic & Math Analysis",
                    prompt:
                      "Explain the P vs NP problem with step-by-step reasoning, real-world complexity implications, and contemporary cryptographic impacts.",
                    model: "cretivra-reason",
                    tag: "Reasoning",
                    color: "text-purple-400",
                  },
                  {
                    title: "Async FastAPI Streaming",
                    prompt:
                      "Write a complete, production-ready Python FastAPI server implementing Server-Sent Events (SSE) streaming with cancellation abort support.",
                    model: "cretivra-coder",
                    tag: "Coding",
                    color: "text-emerald-400",
                  },
                  {
                    title: "Executive PDF Generation",
                    prompt:
                      "Create an executive investment analysis of clean energy and generate a publication-ready PDF document with data tables.",
                    model: "cretivra-1",
                    tag: "PDF Export",
                    color: "text-indigo-400",
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(item.prompt, item.model)}
                    className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-950 ${item.color}`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {item.prompt}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-semibold mt-2 pt-1 border-t border-slate-800/60">
                      <span>Launch in chat</span>
                      <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pro-Tip Box */}
          {step.tip && (
            <div className="mt-5 p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
              <Sparkles size={14} className="text-cyan-400 shrink-0 mt-0.5" />
              <span>{step.tip}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-[#070b16] gap-3 z-10">
          {/* Step Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((s) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  s.id === currentStep
                    ? "w-6 bg-gradient-to-r from-cyan-400 to-purple-500"
                    : "w-2 bg-slate-700 hover:bg-slate-500"
                }`}
                title={`Jump to Step ${s.id}: ${s.tag}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-700/60 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}

            {currentStep < TOUR_STEPS.length ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 transition-all shadow-lg shadow-cyan-950/40 cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 hover:opacity-95 text-slate-950 transition-all shadow-lg shadow-purple-950/50 cursor-pointer"
              >
                Get Started <Sparkles size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
