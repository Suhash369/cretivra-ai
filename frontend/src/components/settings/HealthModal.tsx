import React from 'react';
import { X, Activity, Server, Database, Cpu, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import type { HealthStatus } from '../../types';

interface HealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthStatus | null;
  onRefresh: () => void;
  loading?: boolean;
}

export const HealthModal: React.FC<HealthModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefresh,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2 font-bold text-white text-base">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Cretivra Platform Health</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Body */}
        <div className="p-5 space-y-4">
          {/* Backend Status Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950 border border-gray-800">
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-indigo-400" />
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Cretivra Backend</h4>
                <p className="text-xs text-gray-400">{health?.backend?.name || 'FastAPI Service'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected</span>
            </div>
          </div>

          {/* Ollama Status Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950 border border-gray-800">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-purple-400" />
              <div>
                <h4 className="text-sm font-semibold text-gray-200">Ollama AI Engine</h4>
                <p className="text-xs text-gray-400">{health?.ollama?.url || 'http://localhost:11434'}</p>
              </div>
            </div>
            {health?.ollama?.status === 'connected' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </div>
            ) : health?.ollama?.mock_mode ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Simulation Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/60 border border-rose-800 text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Disconnected</span>
              </div>
            )}
          </div>

          {/* Database Status Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-950 border border-gray-800">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-blue-400" />
              <div>
                <h4 className="text-sm font-semibold text-gray-200">SQLite Storage</h4>
                <p className="text-xs text-gray-400">cretivra.db</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected</span>
            </div>
          </div>

          {/* Registered Models Summary */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex items-center justify-between text-xs">
            <span className="text-indigo-200 font-medium">Registered Cretivra Models Available:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 font-bold text-white">
              {health?.models?.available_count ?? 8} Models
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-between items-center">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-check Health</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
