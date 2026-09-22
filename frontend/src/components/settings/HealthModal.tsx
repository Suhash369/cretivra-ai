import React, { useState, useEffect } from 'react';
import { X, Activity, Server, Database, Cpu, CheckCircle2, AlertCircle, RefreshCw, Check } from 'lucide-react';
import type { HealthStatus } from '../../types';

interface HealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthStatus | null;
  onRefresh: () => Promise<void> | void;
  loading?: boolean;
}

export const HealthModal: React.FC<HealthModalProps> = ({
  isOpen,
  onClose,
  health,
  onRefresh,
  loading = false,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; failedService?: string } | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      setIsClosing(false);
      setIsChecking(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isChecking && !loading) {
        handleAnimatedClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isChecking, loading]);

  if (!isOpen) return null;

  const handleAnimatedClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setFeedback(null);
    }, 180);
  };

  const handleRecheck = async () => {
    if (isChecking || loading) return;
    setIsChecking(true);
    setFeedback(null);

    try {
      await onRefresh();

      // Check results
      const backendOk = !health?.backend || health.backend.status === 'ok' || health.backend.status === 'healthy';
      const dbOk = !health?.database || health.database.status === 'connected' || health.database.status === 'ok';
      const neuralOk = !health?.ollama || health.ollama.status === 'connected' || health.ollama.mock_mode;

      if (!backendOk) {
        setFeedback({ type: 'error', message: '✕ Health check failed', failedService: 'Cretivra Backend is unreachable' });
      } else if (!dbOk) {
        setFeedback({ type: 'error', message: '✕ Health check failed', failedService: 'SQLite Storage is not connected' });
      } else if (!neuralOk) {
        setFeedback({ type: 'error', message: '✕ Health check failed', failedService: 'Neural Core service disconnected' });
      } else {
        // All checks succeeded
        setFeedback({ type: 'success', message: '✓ Health check complete' });
        // Intentional short delay, then smooth auto-close
        setTimeout(() => {
          handleAnimatedClose();
        }, 750);
      }
    } catch (err: any) {
      console.error('Health check failed:', err);
      setFeedback({ type: 'error', message: '✕ Health check failed', failedService: err.message || 'Network connection failed' });
    } finally {
      setIsChecking(false);
    }
  };

  const isBackendHealthy = health?.backend?.status === 'ok' || health?.backend?.status === 'healthy' || health?.status === 'healthy';
  const isNeuralHealthy = health?.ollama?.status === 'connected' || health?.ollama?.mock_mode;
  const isDbHealthy = health?.database?.status === 'connected' || health?.database?.status === 'ok';

  return (
    <div
      className={`fixed inset-0 z-50 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200 ${
        isClosing ? 'animate-modal-overlay-exit' : 'animate-modal-overlay-enter'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isChecking && !loading) {
          handleAnimatedClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-health-title"
    >
      <div
        className={`w-full max-w-md bg-[var(--modal-background)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${
          isClosing ? 'animate-modal-content-exit' : 'animate-modal-content-enter'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50">
          <div className="flex items-center gap-2 font-bold text-[var(--foreground)] text-base">
            <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <span id="platform-health-title">Cretivra Platform Health</span>
          </div>
          <button
            type="button"
            onClick={handleAnimatedClose}
            disabled={isChecking || loading}
            className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
            aria-label="Close platform health"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Feedback Notice */}
        {feedback && (
          <div
            className={`px-5 py-3 border-b text-xs font-semibold flex flex-col gap-0.5 animate-in fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            {feedback.failedService && (
              <span className="text-[11px] font-normal text-rose-500 dark:text-rose-400/90 pl-5.5">
                {feedback.failedService}
              </span>
            )}
          </div>
        )}

        {/* Status Body */}
        <div className="p-5 space-y-3.5 bg-[var(--surface)]">
          {/* Backend Status Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Cretivra Backend</h4>
                <p className="text-xs text-[var(--muted-foreground)]">{health?.backend?.name || 'FastAPI Service'}</p>
              </div>
            </div>
            {isBackendHealthy ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Failed</span>
              </div>
            )}
          </div>

          {/* Neural Engine Status Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)]">Cretivra Neural Core</h4>
                <p className="text-xs text-[var(--muted-foreground)]">Local Hardware Acceleration (Active)</p>
              </div>
            </div>
            {health?.ollama?.status === 'connected' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </div>
            ) : health?.ollama?.mock_mode ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Simulation Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Disconnected</span>
              </div>
            )}
          </div>

          {/* Database Status Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[var(--foreground)]">SQLite Storage</h4>
                <p className="text-xs text-[var(--muted-foreground)]">cretivra.db</p>
              </div>
            </div>
            {isDbHealthy ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Failed</span>
              </div>
            )}
          </div>

          {/* Registered Models Summary */}
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between text-xs">
            <span className="text-cyan-900 dark:text-cyan-200 font-medium">Registered Cretivra Models Available:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-600 font-bold text-white shadow-xs">
              {health?.models?.available_count ?? 18} Models
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 flex justify-between items-center">
          <button
            type="button"
            onClick={handleRecheck}
            disabled={isChecking || loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] border border-[var(--border)] text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking || loading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
            <span>{isChecking || loading ? 'Checking Health...' : 'Re-check Health'}</span>
          </button>
          <button
            type="button"
            onClick={handleAnimatedClose}
            disabled={isChecking || loading}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
