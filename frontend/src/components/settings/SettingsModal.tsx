import React, { useState, useEffect, useRef } from 'react';
import { X, Settings as SettingsIcon, Sliders, Cpu, Shield, Trash2, Check, Loader2, AlertCircle } from 'lucide-react';
import type { SystemSettings, CretivraModel } from '../../types';
import { fetchSettings, updateSettings, clearAllConversations } from '../../services/api';
import { applyTheme, getStoredTheme, type ThemeMode } from '../../services/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: CretivraModel[];
  onConversationsCleared: () => void;
  onSettingsSaved?: (settings: SystemSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  models,
  onConversationsCleared,
  onSettingsSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'ai' | 'engine' | 'privacy'>('ai');
  const [settings, setSettingsState] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem('cretivra_system_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      ollama_base_url: 'http://localhost:11434',
      default_model: 'cretivra-1',
      temperature: 0.7,
      max_context_messages: 30,
      max_output_tokens: 4096,
      system_prompt: 'You are Asura AI by Cretivra, an intelligent AI assistant created by Cretivra.',
      theme: getStoredTheme(),
      max_upload_size_mb: 20,
    };
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Load server settings on open
  useEffect(() => {
    if (isOpen) {
      setSaveError(null);
      setIsClosing(false);
      setSavedNotice(false);
      fetchSettings()
        .then((data) => {
          const currentTheme = getStoredTheme();
          const merged: SystemSettings = { ...data, theme: currentTheme || data.theme };
          setSettingsState(merged);
          try {
            localStorage.setItem('cretivra_system_settings', JSON.stringify(merged));
          } catch {}
        })
        .catch((err) => {
          console.warn('Failed to load settings from server, using local preferences:', err);
        });
    }
  }, [isOpen]);

  // Handle escape key with smooth closing animation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        handleAnimatedClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving]);

  if (!isOpen) return null;

  const handleAnimatedClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSavedNotice(false);
      setSaveError(null);
    }, 180);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    setSavedNotice(false);

    try {
      // 1. Immediately apply theme and persist locally
      if (settings.theme) {
        applyTheme(settings.theme as ThemeMode);
      }
      try {
        localStorage.setItem('cretivra_system_settings', JSON.stringify(settings));
        if (settings.default_model) {
          localStorage.setItem('cretivra_selected_model', settings.default_model);
        }
      } catch {}

      // 2. Persist to backend
      const updated = await updateSettings(settings);
      setSettingsState(updated);
      try {
        localStorage.setItem('cretivra_system_settings', JSON.stringify(updated));
      } catch {}

      // 3. Show brief success feedback
      setSavedNotice(true);
      if (onSettingsSaved) {
        onSettingsSaved(updated);
      }

      // 4. Intentional short delay, then smooth animated auto-close
      setTimeout(() => {
        handleAnimatedClose();
      }, 650);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      // Section 7 & 22: Keep modal open, show clear error and allow retry
      setSaveError(err.message || 'Unable to save your settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearAllConversations();
      onConversationsCleared();
      setConfirmClear(false);
      handleAnimatedClose();
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[var(--modal-overlay)] backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-200 ${
        isClosing ? 'animate-modal-overlay-exit' : 'animate-modal-overlay-enter'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          handleAnimatedClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        ref={modalContentRef}
        className={`w-full max-w-2xl bg-[var(--modal-background)] border border-[var(--border)] text-[var(--foreground)] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] ${
          isClosing ? 'animate-modal-content-exit' : 'animate-modal-content-enter'
        }`}
      >
        {/* Left Settings Sidebar */}
        <div className="w-full md:w-52 bg-[var(--surface-secondary)] p-3 border-r border-[var(--border)] flex flex-row md:flex-col gap-1 overflow-x-auto shrink-0">
          <div className="px-3 py-2 font-bold text-[var(--foreground)] text-sm hidden md:flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Settings</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full transition-colors cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Model & Parameters</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full transition-colors cursor-pointer ${
              activeTab === 'engine'
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Neural Engine Core</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full transition-colors cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Storage</span>
          </button>
        </div>

        {/* Right Settings Content Body */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 bg-[var(--surface)]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 id="settings-modal-title" className="text-lg font-bold text-[var(--foreground)] capitalize">
                {activeTab} Settings
              </h3>
              <button
                type="button"
                onClick={handleAnimatedClose}
                disabled={isSaving}
                className="p-1 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert if any (keeps modal open with retry) */}
            {saveError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>{saveError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveError(null)}
                  className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-white ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* AI Parameters Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-4 text-xs text-[var(--foreground)]">
                <div>
                  <label className="block text-[var(--foreground)] font-medium mb-1.5">Default Model</label>
                  <select
                    value={settings.default_model}
                    onChange={(e) => setSettingsState({ ...settings, default_model: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name} ({m.category || 'General'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-[var(--foreground)] font-medium">Temperature</label>
                    <span className="text-cyan-700 dark:text-cyan-400 font-mono font-semibold">{settings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => setSettingsState({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1">
                    <span>0.0 Precise</span>
                    <span>0.7 Balanced</span>
                    <span>1.5 Creative</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--foreground)] font-medium mb-1.5">Max Context Messages</label>
                  <input
                    type="number"
                    value={settings.max_context_messages}
                    onChange={(e) => setSettingsState({ ...settings, max_context_messages: parseInt(e.target.value) || 30 })}
                    className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1">Number of previous conversational turns remembered for context continuity.</p>
                </div>
              </div>
            )}

            {/* Neural Engine Core Tab */}
            {activeTab === 'engine' && (
              <div className="space-y-4 text-xs text-[var(--foreground)]">
                <div>
                  <label className="block text-[var(--foreground)] font-medium mb-1.5">Inference Engine Endpoint</label>
                  <input
                    type="text"
                    value={settings.ollama_base_url}
                    onChange={(e) => setSettingsState({ ...settings, ollama_base_url: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1">Default local acceleration endpoint: http://localhost:11434</p>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 text-xs text-[var(--foreground)]">
                <div>
                  <label className="block text-[var(--foreground)] font-medium mb-2">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as ThemeMode[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setSettingsState({ ...settings, theme: t });
                          applyTheme(t);
                        }}
                        className={`p-3 rounded-xl border text-center capitalize font-semibold transition-all cursor-pointer ${
                          settings.theme === t
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 font-bold shadow-xs'
                            : 'bg-[var(--surface-secondary)] border-[var(--border)] text-[var(--foreground)] hover:border-cyan-500/40'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-2">
                    {settings.theme === 'system'
                      ? 'Automatically synchronizes with your operating system color scheme.'
                      : `Live ${settings.theme} appearance active.`}
                  </p>
                </div>
              </div>
            )}

            {/* Privacy & Data Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 text-xs text-[var(--foreground)]">
                <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] space-y-2">
                  <h4 className="font-semibold text-[var(--foreground)]">Local-First Storage Guarantee</h4>
                  <p className="text-[var(--muted-foreground)] text-[11px] leading-relaxed">
                    Your conversations and tasks are processed with local privacy guarantees. Telemetry is confined to platform diagnostics.
                  </p>
                </div>

                <div className="pt-2">
                  {confirmClear ? (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 space-y-3">
                      <p className="text-rose-700 dark:text-rose-300 font-semibold text-xs">Are you sure you want to clear all conversation history?</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleClearHistory}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-500 cursor-pointer"
                        >
                          Yes, Clear All Data
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClear(false)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold transition-colors w-full justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Conversation History</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Save Controls */}
          <div className="pt-6 border-t border-[var(--border)] flex justify-between items-center">
            {savedNotice ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in">
                <Check className="w-4 h-4" /> ✓ Changes saved
              </span>
            ) : saveError ? (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Save failed
              </span>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={handleAnimatedClose}
                className="px-4 py-2 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] border border-[var(--border)] text-xs font-medium cursor-pointer transition-colors disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20 transition-all active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
