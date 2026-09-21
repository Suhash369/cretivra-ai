import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Globe,
  Code2,
  Search,
  LineChart,
  Presentation,
  FileText,
  Users,
  Zap,
  Layers,
  Cpu,
  Loader2,
} from 'lucide-react';
import { startPlaygroundRunApi } from '../services/playgroundApi';

interface PlaygroundHomeProps {
  onStartRun: (runId: string) => void;
  initialPrompt?: string;
}

const QUICK_ACTIONS = [
  {
    id: 'build_website',
    title: 'Build Website',
    desc: 'Build a modern responsive web application in React & Tailwind CSS',
    icon: Globe,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    prompt: 'Build a modern responsive portfolio web application with dark mode in React and Tailwind CSS.',
  },
  {
    id: 'build_app',
    title: 'Build App',
    desc: 'Scaffold full-stack CRM application with state management and database',
    icon: Code2,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    prompt: 'Build a CRM dashboard application for sales pipeline management.',
  },
  {
    id: 'research',
    title: 'Research',
    desc: 'Deep research report with verified 2026 sources & citations',
    icon: Search,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    prompt: 'Research the AI CRM market in 2026 and synthesize a verified technical analysis report.',
  },
  {
    id: 'analyze_data',
    title: 'Analyze Data',
    desc: 'Upload CSV/JSON data to compute exact statistical trends and anomalies',
    icon: LineChart,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    prompt: 'Analyze sales revenue data, compute statistical anomalies, and identify root causes.',
  },
  {
    id: 'create_presentation',
    title: 'Create Presentation',
    desc: 'Synthesize a modern 16:9 widescreen Microsoft PowerPoint deck (.pptx)',
    icon: Presentation,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    prompt: 'Create a 16:9 widescreen presentation deck on Enterprise AI Autonomous Agents.',
  },
  {
    id: 'generate_report',
    title: 'Generate Report',
    desc: 'Compile a publication-grade executive vector PDF report with ReportLab',
    icon: FileText,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    prompt: 'Generate an executive PDF report on Cloud Architecture and Zero-Cost Scalability.',
  },
  {
    id: 'find_leads',
    title: 'Find Leads',
    desc: 'B2B sales lead qualification and structured outreach drafting',
    icon: Users,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    prompt: 'Find potential enterprise B2B customers for our AI automation platform and draft qualification criteria.',
  },
  {
    id: 'automate_task',
    title: 'Automate Task',
    desc: 'Orchestrate multi-step task execution with verification and self-correction',
    icon: Zap,
    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    prompt: 'Automate competitor product audit and produce comparative feature benchmarking matrix.',
  },
];

export function PlaygroundHome({ onStartRun, initialPrompt }: PlaygroundHomeProps) {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedModel, setSelectedModel] = useState('cretivra-1');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await startPlaygroundRunApi({
        prompt: cleanPrompt,
        model_id: selectedModel,
      });
      onStartRun(res.run_id);
    } catch (err: any) {
      alert(`Error launching task: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#060911] text-slate-100 p-6 md:p-12 flex flex-col items-center justify-start min-h-full">
      <div className="w-full max-w-4xl flex flex-col items-center text-center mt-4 md:mt-8">
        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#151c2e] border border-[#232d45] text-xs font-semibold text-cyan-400 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ASURA PLAYGROUND &bull; AUTONOMOUS EXECUTION ENGINE</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-3 leading-tight">
          What do you want Asura to <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">build or accomplish?</span>
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mb-8">
          Tell Asura what you want done, not how to do it. Autonomous planning, multi-step execution, sandboxed testing, and artifact generation.
        </p>

        {/* Natural Language Task Composer */}
        <form
          onSubmit={handleSubmit}
          className="w-full bg-[#0d121f] border border-[#232d45] focus-within:border-cyan-500/60 rounded-2xl p-3 shadow-2xl shadow-cyan-950/20 transition-all mb-10 text-left"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="E.g., Build a CRM for my sales team with customer tracking and deal stages..."
            className="w-full h-28 md:h-32 bg-transparent text-slate-100 placeholder-slate-500 text-sm md:text-base resize-none focus:outline-none px-3 py-2"
          />

          <div className="flex items-center justify-between border-t border-[#232d45]/60 pt-3 px-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  aria-label="Select Foundation Model Tier"
                  className="bg-transparent border-0 text-xs font-mono text-slate-300 focus:outline-none cursor-pointer"
                >
                  <option value="cretivra-1" className="bg-slate-900">Cretivra 1 (Balanced)</option>
                  <option value="cretivra-coder" className="bg-slate-900">Cretivra Coder Pro</option>
                  <option value="cretivra-reason" className="bg-slate-900">Cretivra Reason</option>
                  <option value="cretivra-1.1" className="bg-slate-900">Cretivra 1.1 (Multimodal)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs md:text-sm shadow-md shadow-cyan-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Planning Task...</span>
                </>
              ) : (
                <>
                  <span>Execute Task</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Action Cards Grid */}
        <div className="w-full text-left mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 px-1">
            Quick Autonomous Workflows
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  onClick={() => {
                    setPrompt(action.prompt);
                  }}
                  className="p-4 rounded-xl bg-[#0d121f] border border-[#232d45] hover:border-cyan-500/50 hover:bg-[#151c2e] transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border mb-3 ${action.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      {action.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-[#232d45]/40 flex items-center text-[11px] font-medium text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Use workflow</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
