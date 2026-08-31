import React, { useState } from "react";
import { X, Mail, Lock, User, LogIn, UserPlus, Sparkles } from "lucide-react";
import { CretivraMark } from "../common/CretivraLogo";

import { loginUserApi, registerUserApi } from "../../services/api";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let data;
      if (tab === "login") {
        data = await loginUserApi({ email, password });
      } else {
        data = await registerUserApi({ email, password, full_name: fullName });
      }

      // Save token and user info
      localStorage.setItem("cretivra_auth_token", data.access_token);
      localStorage.setItem("cretivra_user", JSON.stringify(data.user));

      onLoginSuccess(data.user, data.access_token);
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d121f] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-950/40 text-slate-100 overflow-hidden">
        
        {/* Glow ambient accent */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <CretivraMark size={36} />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Cretivra AI
            </span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Your private account for secure AI conversations & sync
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#151c2e] p-1 rounded-xl mb-6 border border-slate-800">
          <button
            onClick={() => { setTab("login"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === "login"
                ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <LogIn size={16} /> Sign In
          </button>
          <button
            onClick={() => { setTab("register"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === "register"
                ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus size={16} /> Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <X size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "register" && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#151c2e] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-[#151c2e] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#151c2e] border border-slate-700 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-90 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : tab === "login" ? (
              <>
                <LogIn size={18} /> Sign In to Cretivra
              </>
            ) : (
              <>
                <Sparkles size={18} /> Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-slate-500 text-center mt-4">
          All passwords are encrypted with bcrypt and stored in Supabase PostgreSQL.
        </p>
      </div>
    </div>
  );
}
