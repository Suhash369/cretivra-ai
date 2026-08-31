import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, ShieldCheck, Sparkles, ArrowRight, Copy, Check, Lock, Smartphone, RefreshCw, AlertCircle } from 'lucide-react';
import { CretivraMark } from '../common/CretivraLogo';
import { createUpiOrderApi, verifyUpiPaymentApi, checkOrderStatusApi } from '../../services/api';
import type { SubscriptionStatus } from '../../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: SubscriptionStatus | null;
  onSubscriptionSuccess: (status: SubscriptionStatus) => void;
  isMandatory?: boolean;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  subscription = null,
  onSubscriptionSuccess,
  isMandatory = false,
}: SubscriptionModalProps) {
  const [order, setOrder] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pollingTimerRef = useRef<any>(null);

  // Initialize or fetch ₹20 UPI Order on open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setUtrNumber('');
      initOrder();
    }
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [isOpen]);

  const initOrder = async () => {
    try {
      const orderData = await createUpiOrderApi('15-Day Pass');
      setOrder(orderData);
      startPolling(orderData.order_id);
    } catch (e: any) {
      console.error('Failed to create UPI order:', e);
    }
  };

  // Start real-time background polling every 2.5 seconds
  const startPolling = (orderId: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    setPollingActive(true);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const check = await checkOrderStatusApi(orderId);
        if (check.status === 'completed' || check.is_subscribed) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setPollingActive(false);
          setSuccessMsg('Payment confirmed in real-time! 15-Day Pass unlocked.');
          setTimeout(() => {
            onSubscriptionSuccess({
              is_subscribed: true,
              subscription_expires_at: check.subscription_expires_at,
              days_left: check.days_left || 15,
              plan_name: '15-Day Pass',
              is_expired: false,
            });
            onClose();
          }, 1000);
        }
      } catch (err) {
        // Silent polling fail
      }
    }, 2500);
  };

  if (!isOpen) return null;

  const upiId = order?.upi_id || 'suhashsugi369-1@oksbi';
  const merchantName = order?.merchant_name || 'SUHASH MAHADEVA';
  const upiDeepLink = order?.upi_intent_url || `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=20.00&cu=INR&tn=CretivraAI15DayPass`;
  
  // Real dynamic QR code URL with locked amount ₹20
  const qrCodeUrl = order?.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiDeepLink)}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      setError('Please enter the valid 12-digit UPI Reference / UTR Number from your payment app receipt.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await verifyUpiPaymentApi({
        order_id: order?.order_id,
        utr_number: cleanUtr,
        upi_id: upiId,
        amount: 20.0,
      });

      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      setSuccessMsg(data.message || 'Payment verified! 15-day subscription activated.');
      setTimeout(() => {
        onSubscriptionSuccess({
          is_subscribed: true,
          subscription_expires_at: data.subscription_expires_at,
          days_left: data.days_left || 15,
          plan_name: '15-Day Pass',
          is_expired: false,
        });
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Payment verification failed. Please check your transaction reference.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d121f] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Glow ambient accent */}
        <div className="absolute -top-16 -left-16 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <CretivraMark size={26} />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Activate Cretivra AI Pass
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 font-mono font-semibold">
                  ₹20 / 15 Days
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Official UPI Instant Activation • Zero Wait Time</p>
            </div>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Plan Badge & Pricing */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-gray-900/80 to-purple-950/40 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={12} /> Mandatory Access Pass
              </div>
              <div className="text-2xl font-black text-white mt-0.5 flex items-baseline gap-1.5">
                ₹20 <span className="text-xs font-normal text-gray-400">for 15 Days Unlimited AI Access</span>
              </div>
              {subscription?.is_subscribed && (
                <div className="text-[11px] text-emerald-400 font-medium mt-1">
                  Active: {subscription.days_left} days remaining. Paying ₹20 will extend by +15 days.
                </div>
              )}
            </div>
            <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1">
              <Sparkles size={13} /> Real-Time
            </div>
          </div>

          {/* Error / Success Alerts */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle size={16} className="shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* UPI Scan & Pay Area */}
          <div className="p-4 bg-gray-900/80 rounded-xl border border-gray-800 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-xs font-bold text-white">Step 1: Scan & Pay ₹20 using any UPI App</div>
              <div className="text-[11px] text-gray-400">Google Pay • PhonePe • Paytm • BHIM • Cred • Banking Apps</div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center">
              <div className="p-2.5 bg-white rounded-2xl shadow-xl border-4 border-cyan-500/40">
                <img src={qrCodeUrl} alt="UPI QR Code" className="w-40 h-40 object-contain" />
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-bold text-slate-200">{merchantName}</div>
                <div className="text-[11px] text-gray-400">Amount: <span className="text-emerald-400 font-bold">₹20.00 INR</span></div>
              </div>
            </div>

            {/* UPI ID Pill with Copy */}
            <div className="flex items-center gap-2 bg-gray-950 p-2.5 rounded-xl border border-gray-800 font-mono text-xs">
              <span className="text-gray-400 text-[11px]">UPI ID:</span>
              <span className="text-cyan-300 font-semibold truncate">{upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-[11px] transition-colors cursor-pointer"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* 1-Click Mobile UPI Deep Link */}
            <div className="sm:hidden">
              <a
                href={upiDeepLink}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Smartphone size={15} /> Open in GPay / PhonePe / Paytm
              </a>
            </div>
          </div>

          {/* Step 2: UTR Reference Verification */}
          <form onSubmit={handleUpiSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Step 2: Enter 12-Digit UPI Ref / UTR Transaction Number:
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 423892837492 (from payment receipt)"
                className="w-full bg-[#151c2e] border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Found in your Google Pay, PhonePe, or Paytm receipt under "UPI transaction ID" or "UTR".
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !utrNumber.trim()}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Payment & Unlock AI Service</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Real-time Polling Pulse */}
          {pollingActive && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-cyan-400/80 font-mono animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              <span>Real-time listener active: waiting for UPI confirmation...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-gray-800/80 bg-gray-900/50 text-[10px] text-gray-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>Encrypted real-time verification • 100% genuine service activation</span>
        </div>
      </div>
    </div>
  );
}
