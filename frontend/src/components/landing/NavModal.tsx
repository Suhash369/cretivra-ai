import React from 'react';
import { X, Check, Bot, Zap, Shield, Cpu, Sparkles, Users, Award, Calendar, CreditCard, ArrowRight } from 'lucide-react';

export type NavModalType = 'features' | 'solutions' | 'resources' | 'events' | 'team' | 'pricing' | null;

interface NavModalProps {
  type: NavModalType;
  onClose: () => void;
  onOpenAuth: (tab: 'login' | 'register') => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function NavModal({ type, onClose, onOpenAuth, onSelectPrompt }: NavModalProps) {
  if (!type) return null;

  const contentMap: Record<
    string,
    {
      title: string;
      subtitle: string;
      badge: string;
      body: React.ReactNode;
    }
  > = {
    features: {
      title: 'Asura AI Core Capabilities',
      subtitle: 'Autonomous execution engine built for multi-step tasks, tools & reasoning',
      badge: 'Agent Architecture',
      body: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2.5">
              <Bot size={18} />
            </div>
            <h4 className="font-semibold text-sm mb-1">Autonomous Execution</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Deconstruct complex goals into multi-stage tasks, calling browser APIs, database queries, and code sandboxes.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5">
              <Sparkles size={18} />
            </div>
            <h4 className="font-semibold text-sm mb-1">Multimodal Synthesis</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Generate native PowerPoint presentations, production HTML/JS web apps, 2D arcade games, and high-res art in one canvas.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
              <Cpu size={18} />
            </div>
            <h4 className="font-semibold text-sm mb-1">Intelligence Cache</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Sub-second live web verification and memory layer that reduces hallucinations and retrieves verified factual data.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
              <Shield size={18} />
            </div>
            <h4 className="font-semibold text-sm mb-1">Zero Data Retention</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Your proprietary company context and code remain strictly yours. Zero training on enterprise chat histories.
            </p>
          </div>
        </div>
      ),
    },
    solutions: {
      title: 'Enterprise & Team Solutions',
      subtitle: 'Engineered for developers, operations, and creative production',
      badge: 'Verticals',
      body: (
        <div className="space-y-3 py-2">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
              <Zap size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Engineering &amp; Code Prototyping</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Generate complete web applications, interactive tools, browser games, and API scripts on command.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
              <Award size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Executive Decks &amp; Presentation Strategy</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Transform rough ideas into structured .PPTX presentations ready for investor and team briefings.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Visual Asset Design &amp; Concepts</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Generate high-resolution photorealistic imagery, digital illustrations, and 3D concept art.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    resources: {
      title: 'Resources & Documentation',
      subtitle: 'Developer guides, model arena benchmarks, and technical papers',
      badge: 'Knowledge Hub',
      body: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <a
            href="/test-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all block"
          >
            <span className="text-xs font-semibold text-gray-900 dark:text-white block">Model Test Bench Arena &rarr;</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
              Side-by-side benchmark comparison of frontier intelligence architectures.
            </span>
          </a>
          <a
            href="/blog"
            className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all block"
          >
            <span className="text-xs font-semibold text-gray-900 dark:text-white block">Insights &amp; Engineering Blog &rarr;</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
              Deep dives into AI agent workflows, reasoning loops, and prompt architecture.
            </span>
          </a>
          <a
            href="/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all block"
          >
            <span className="text-xs font-semibold text-gray-900 dark:text-white block">Fullscreen Studio Workspace &rarr;</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
              Direct access to frontier models, multi-turn reasoning, and intelligence cache.
            </span>
          </a>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 block">
            <span className="text-xs font-semibold text-gray-900 dark:text-white block">API &amp; Agent SDK</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 block">
              RESTful endpoints for conversational agents and headless generation pipelines.
            </span>
          </div>
        </div>
      ),
    },
    events: {
      title: 'Events & Community',
      subtitle: 'Upcoming hackathons, agent demos, and live product keynotes',
      badge: 'Calendar 2026',
      body: (
        <div className="space-y-3 py-2">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold dark:bg-purple-950 dark:text-purple-300">Live Virtual</span>
                <span className="text-xs text-gray-400">Monthly</span>
              </div>
              <h4 className="font-semibold text-sm mt-1">Autonomous Agent Masterclass</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Hands-on live demonstration building end-to-end agents with Asura AI &amp; Cretivra Engine.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-semibold dark:bg-cyan-950 dark:text-cyan-300">Hackathon</span>
                <span className="text-xs text-gray-400">Quarterly</span>
              </div>
              <h4 className="font-semibold text-sm mt-1">Global AI Builder Challenge</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                $25,000 prize pool building multimodal tools, playable web games, and automated workflows.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    team: {
      title: 'About Asura AI & Cretivra',
      subtitle: 'Building independent intelligence architecture that executes, not just chats',
      badge: 'Our Mission',
      body: (
        <div className="py-2 space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            At Asura AI by Cretivra, we believe that AI should take action. Rather than stopping at generic conversational answers, Asura executes multi-step workflows: generating complete slide decks, coding and deploying responsive websites, building playable games, and producing visual assets.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-lg font-bold text-gray-900 dark:text-white block">100%</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Independent</span>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400 block">&lt;200ms</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Inference Latency</span>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400 block">Zero</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold">Data Leakage</span>
            </div>
          </div>
        </div>
      ),
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Start free and upgrade when you need advanced agent execution',
      badge: 'Plans',
      body: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">Free Starter</h4>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium">Included</span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                $0 <span className="text-xs font-normal text-gray-500">/ forever</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2"><Check size={13} className="text-emerald-500" /> Standard AI Chat &amp; Coding</li>
                <li className="flex items-center gap-2"><Check size={13} className="text-emerald-500" /> Slide &amp; Website Generation</li>
                <li className="flex items-center gap-2"><Check size={13} className="text-emerald-500" /> 10 Daily High-Res Images</li>
              </ul>
            </div>
            <button
              onClick={() => {
                onOpenAuth('register');
                onClose();
              }}
              className="mt-5 w-full py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          <div className="p-5 rounded-2xl border-2 border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800/80 flex flex-col justify-between relative shadow-lg">
            <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold uppercase tracking-wider">
              Popular
            </span>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm">Pro Agent</h4>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                $20 <span className="text-xs font-normal text-gray-500">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                <li className="flex items-center gap-2"><Check size={13} className="text-cyan-500" /> Frontier Reasoning &amp; DeepThink</li>
                <li className="flex items-center gap-2"><Check size={13} className="text-cyan-500" /> Unlimited PPTX Slide Deck Exports</li>
                <li className="flex items-center gap-2"><Check size={13} className="text-cyan-500" /> Unlimited FLUX.1 &amp; SDXL Image Synthesis</li>
                <li className="flex items-center gap-2"><Check size={13} className="text-cyan-500" /> Priority Cloud Compute Sandboxes</li>
              </ul>
            </div>
            <button
              onClick={() => {
                onOpenAuth('register');
                onClose();
              }}
              className="mt-5 w-full py-2 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold shadow-md cursor-pointer"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      ),
    },
  };

  const item = contentMap[type];
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-gray-900 dark:text-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                {item.badge}
              </span>
            </div>
            <h3 className="text-lg font-bold">{item.title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-4">{item.body}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
