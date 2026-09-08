import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, Sliders, Cpu, Shield, Trash2, Check } from 'lucide-react';
import type { SystemSettings, CretivraModel } from '../../types';
import { fetchSettings, updateSettings, clearAllConversations } from '../../services/api';
import { applyTheme, getStoredTheme, type ThemeMode } from '../../services/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: CretivraModel[];
  onConversationsCleared: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  models,
  onConversationsCleared,
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'ai' | 'engine' | 'privacy'>('ai');
  const [settings, setSettingsState] = useState<SystemSettings>({
    ollama_base_url: 'http://localhost:11434',
    default_model: 'cretivra-1',
    temperature: 0.7,
    max_context_messages: 30,
    max_output_tokens: 4096,
    system_prompt: 'You are Asura AI by Cretivra, an intelligent AI assistant created by Cretivra.',
    theme: getStoredTheme(),
    max_upload_size_mb: 20,
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings()
        .then((data) => {
          const currentTheme = getStoredTheme();
          setSettingsState({ ...data, theme: currentTheme || data.theme });
        })
        .catch((err) => console.error('Failed to load settings:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      if (settings.theme) {
        applyTheme(settings.theme as ThemeMode);
      }
      const updated = await updateSettings(settings);
      setSettingsState(updated);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearAllConversations();
      onConversationsCleared();
      setConfirmClear(false);
      onClose();
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text)] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        {/* Left Settings Sidebar */}
        <div className="w-full md:w-52 bg-[var(--bg-base)] p-3 border-r border-[var(--border)] flex flex-row md:flex-col gap-1 overflow-x-auto shrink-0">
          <div className="px-3 py-2 font-bold text-[var(--text)] text-sm hidden md:flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-indigo-400" />
            <span>Settings</span>
          </div>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full transition-colors ${
              activeTab === 'ai' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 hover:bg-gray-800/40'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Model & Parameters</span>
          </button>

          <button
            onClick={() => setActiveTab('engine')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full transition-colors ${
              activeTab === 'engine' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 hover:bg-gray-800/40'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Neural Engine Core</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full transition-colors ${
              activeTab === 'appearance' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 hover:bg-gray-800/40'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Appearance</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium w-full transition-colors ${
              activeTab === 'privacy' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-gray-400 hover:bg-gray-800/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy & Storage</span>
          </button>
        </div>

        {/* Right Settings Content Body */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 bg-gray-900">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white capitalize">{activeTab} Settings</h3>
              <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Parameters Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-4 text-xs text-gray-300">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Default Model</label>
                  <select
                    value={settings.default_model}
                    onChange={(e) => setSettingsState({ ...settings, default_model: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 focus:outline-none focus:border-indigo-500"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.display_name} ({m.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-gray-400 font-medium">Temperature</label>
                    <span className="text-indigo-400 font-mono">{settings.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => setSettingsState({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">Max Context Messages</label>
                  <input
                    type="number"
                    value={settings.max_context_messages}
                    onChange={(e) => setSettingsState({ ...settings, max_context_messages: parseInt(e.target.value) || 30 })}
                    className="w-full p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-medium mb-1">System Prompt</label>
                  <textarea
                    rows={3}
                    value={settings.system_prompt}
                    onChange={(e) => setSettingsState({ ...settings, system_prompt: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-gray-950 border border-gray-800 text-gray-100 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Neural Engine Core Tab */}
            {activeTab === 'engine' && (
              <div className="space-y-4 text-xs text-gray-300">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Inference Engine Endpoint</label>
                  <input
                    type="text"
                    value={settings.ollama_base_url}
                    onChange={(e) => setSettingsState({ ...settings, ollama_base_url: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text)] font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Default local acceleration endpoint: http://localhost:11434</p>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 text-xs text-gray-300">
                <div>
                  <label className="block text-gray-400 font-medium mb-2">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['dark', 'light', 'system'] as ThemeMode[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setSettingsState({ ...settings, theme: t });
                          applyTheme(t);
                        }}
                        className={`p-3 rounded-xl border text-center capitalize font-semibold transition-all cursor-pointer ${
                          settings.theme === t
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400 font-bold'
                            : 'bg-[var(--bg-base)] border-[var(--border)] text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">
                    {settings.theme === 'system'
                      ? 'Automatically synchronizes with your operating system color scheme.'
                      : `Live ${settings.theme} appearance active.`}
                  </p>
                </div>
              </div>
            )}

            {/* Privacy & Data Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 text-xs text-gray-300">
                <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
                  <h4 className="font-semibold text-white">Local-First Storage Guarantee</h4>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    Your conversations are processed locally through your configured AI infrastructure. No external tracking or telemetry is transmitted.
                  </p>
                </div>

                <div className="pt-2">
                  {confirmClear ? (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 space-y-3">
                      <p className="text-rose-300 font-semibold text-xs">Are you sure you want to clear all conversation history?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleClearHistory}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-500"
                        >
                          Yes, Clear All Data
                        </button>
                        <button
                          onClick={() => setConfirmClear(false)}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/60 text-rose-400 font-semibold transition-colors w-full justify-center"
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
          <div className="pt-6 border-t border-gray-800 flex justify-between items-center">
            {savedNotice ? (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                <Check className="w-4 h-4" /> Saved successfully
              </span>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium">
                Close
              </button>
              <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
