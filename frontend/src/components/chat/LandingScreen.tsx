import React from 'react';
import { Search, Code, Sparkles, FileText, ArrowUpRight } from 'lucide-react';
import { CretivraLogo } from '../common/CretivraLogo';

interface LandingScreenProps {
  onSelectPrompt: (prompt: string) => void;
}

const SUGGESTED_PROMPTS = [
  {
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    title: 'Generate an AI Image',
    subtitle: 'high-resolution FLUX.1 cyber visual art',
    prompt: 'Generate an image of a futuristic cyberpunk city with neon reflections and glowing flying cars, ultra-detailed 8k',
  },
  {
    icon: <Code className="w-4 h-4 text-emerald-400" />,
    title: 'Write a Python script',
    subtitle: 'to generate odd numbers or process data streams',
    prompt: 'Write a clean Python function to generate odd numbers up to N with list comprehension and generators.',
  },
  {
    icon: <Search className="w-4 h-4 text-cyan-400" />,
    title: 'Research a topic',
    subtitle: 'multi-agent AI orchestration architecture',
    prompt: 'Provide a structured research breakdown on autonomous AI agent execution frameworks.',
  },
  {
    icon: <FileText className="w-4 h-4 text-blue-400" />,
    title: 'Analyze document & data',
    subtitle: 'summarize key takeaways from text or files',
    prompt: 'How should I structure a comprehensive technical document analysis report?',
  },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pt-6 pb-32 max-w-3xl mx-auto w-full text-center select-none">
      {/* Centered Glowing Cretivra Infinity Logo */}
      <div className="relative mb-4 group cursor-pointer">
        <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition duration-700 animate-pulse-glow" />
        <div className="relative p-3.5 rounded-2xl bg-gray-900/90 border border-gray-800 shadow-2xl flex items-center justify-center">
          <CretivraLogo size={44} animated={true} />
        </div>
      </div>

      {/* Main ChatGPT-Style Greeting */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
        What can I help with today?
      </h1>
      <p className="text-xs sm:text-sm text-gray-400 mb-6 font-medium">
        Cretivra AI • Local-First Intelligence • Privacy Guaranteed
      </p>

      {/* 2x2 Suggested Action Cards (ChatGPT Replica Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
        {SUGGESTED_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex items-start justify-between p-4 rounded-2xl bg-gray-900/70 hover:bg-gray-850 border border-gray-800/80 hover:border-cyan-500/40 transition-all duration-200 shadow-md text-left"
          >
            <div className="space-y-1 pr-2">
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="text-xs font-semibold text-gray-200 group-hover:text-white">
                  {item.title}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 group-hover:text-gray-300 line-clamp-1">
                {item.subtitle}
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};
