'use client';

import React from 'react';
import { CornerDownRight, Sparkles } from 'lucide-react';

interface RelatedQuestionsProps {
  questions?: string[];
  onSelectQuestion?: (question: string) => void;
}

export const RelatedQuestions: React.FC<RelatedQuestionsProps> = ({
  questions,
  onSelectQuestion,
}) => {
  if (!questions || questions.length === 0) {
    return null;
  }

  // Deduplicate and filter out empty questions
  const validQuestions = Array.from(new Set(questions.filter((q) => q && q.trim().length > 0))).slice(0, 4);

  if (validQuestions.length === 0) {
    return null;
  }

  return (
    <div className="my-3 space-y-2 pt-1 animate-in fade-in duration-200">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
        <span className="font-semibold text-[11px] tracking-wide uppercase">Related Questions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {validQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectQuestion?.(q)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-500/10 dark:bg-slate-900/60 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-xs text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-left cursor-pointer"
          >
            <CornerDownRight className="w-3 h-3 text-slate-400 group-hover:text-cyan-500 transition-colors shrink-0" />
            <span className="font-medium">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
