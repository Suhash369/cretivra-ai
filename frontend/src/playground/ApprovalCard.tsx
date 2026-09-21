import React, { useState } from 'react';
import { ShieldAlert, Check, X, Edit3, Lock } from 'lucide-react';
import type { ApprovalRequest } from '../services/playgroundApi';

interface ApprovalCardProps {
  approval: ApprovalRequest;
  onApprove: (approvalId: string, modifiedPayload?: any) => Promise<void>;
  onDeny: (approvalId: string) => Promise<void>;
  isProcessing?: boolean;
}

export function ApprovalCard({ approval, onApprove, onDeny, isProcessing }: ApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPayload, setEditedPayload] = useState(() => JSON.stringify(approval.payload || {}, null, 2));

  return (
    <div className="bg-amber-50/70 dark:bg-[#151c2e] border-2 border-amber-500/60 rounded-xl p-4 shadow-xl dark:shadow-2xl shadow-amber-950/20 dark:shadow-amber-950/40 animate-in fade-in zoom-in-95">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              Asura Wants Your Approval
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              Risk: {approval.risk_level}
            </span>
          </div>

          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{approval.description}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Tool: <code className="text-cyan-700 dark:text-cyan-400 font-mono">{approval.tool_name}</code>
          </p>

          {approval.payload && Object.keys(approval.payload).length > 0 && (
            <div className="mt-3">
              {isEditing ? (
                <textarea
                  value={editedPayload}
                  onChange={(e) => setEditedPayload(e.target.value)}
                  className="w-full h-24 p-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-400"
                />
              ) : (
                <pre className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-300 overflow-x-auto max-h-32">
                  {JSON.stringify(approval.payload, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={async () => {
                let parsed = undefined;
                if (isEditing) {
                  try {
                    parsed = JSON.parse(editedPayload);
                  } catch {
                    alert('Invalid JSON in edited payload.');
                    return;
                  }
                }
                await onApprove(approval.id, parsed);
              }}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Approve Action
            </button>

            <button
              onClick={() => onDeny(approval.id)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Deny
            </button>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditing ? 'Cancel Edit' : 'Edit Payload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
