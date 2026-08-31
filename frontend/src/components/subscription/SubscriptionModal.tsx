import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, QrCode, CreditCard, Sparkles, ArrowRight, Copy, Check } from 'lucide-react';
import { CretivraMark } from '../common/CretivraLogo';
import { createPaymentOrderApi, verifyRazorpayPaymentApi, submitUpiPaymentApi } from '../../services/api';
import type { SubscriptionStatus } from '../../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionStatus | null;
  onSubscriptionSuccess: (status: SubscriptionStatus) => void;
  upiId?: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  subscription,
  onSubscriptionSuccess,
  upiId = 'suhashsugi369@okaxis',
}: SubscriptionModalProps) {
  const [method, setMethod] = useState<'upi' | 'razorpay'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setError('Please enter a valid 12-digit UPI Reference / UTR Transaction ID from your payment app.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await submitUpiPaymentApi({
        utr_transaction_id: utrNumber.trim(),
        amount: 20.0,
      });

      setSuccessMsg('Payment verified! 15-day subscription activated.');
      setTimeout(() => {
        onSubscriptionSuccess({
          is_subscribed: true,
          subscription_expires_at: data.subscription_expires_at,
          days_left: data.days_left || 15,
          plan_name: '15-Day Pass',
          is_expired: false,
        });
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Payment activation failed. Please check your transaction ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      const order = await createPaymentOrderApi('15-Day Pass');

      // Check if Razorpay script is present in window
      if ((window as any).Razorpay) {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'Cretivra AI',
          description: '15-Day Full AI Platform Pass (₹20)',
          image: '/favicon.svg',
          order_id: order.order_id,
          prefill: {
            name: order.user_name,
            email: order.user_email,
          },
          theme: {
            color: '#06b6d4',
          },
          handler: async (response: any) => {
            const verified = await verifyRazorpayPaymentApi({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onSubscriptionSuccess({
              is_subscribed: true,
              subscription_expires_at: verified.subscription_expires_at,
              days_left: verified.days_left || 15,
              plan_name: '15-Day Pass',
              is_expired: false,
            });
            onClose();
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback for dev / direct simulated verification
        const verified = await verifyRazorpayPaymentApi({
          razorpay_order_id: order.order_id,
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 11)}`,
        });
        setSuccessMsg('Razorpay payment verified! 15-day pass activated.');
        setTimeout(() => {
          onSubscriptionSuccess({
            is_subscribed: true,
            subscription_expires_at: verified.subscription_expires_at,
            days_left: verified.days_left || 15,
            plan_name: '15-Day Pass',
            is_expired: false,
          });
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  // Generate UPI QR Code URL
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `upi://pay?pa=${upiId}&pn=CretivraAI&am=20.00&cu=INR&tn=CretivraAI15DayPass`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d121f] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow ambient background accent */}
        <div className="absolute -top-16 -left-16 w-52 h-52 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-52 h-52 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <CretivraMark size={24} />
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Cretivra AI Pass
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 font-mono">
                  ₹20 / 15 Days
                </span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Plan Summary Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-gray-900/60 to-purple-950/40 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">All-Inclusive Pass</div>
                <div className="text-2xl font-extrabold text-white flex items-baseline gap-1 mt-0.5">
                  ₹20 <span className="text-xs font-normal text-gray-400">/ 15 Days Validity</span>
                </div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1">
                <Sparkles size={13} /> Active 24/7
              </div>
            </div>

            {/* Feature List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300 pt-2 border-t border-gray-800">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-cyan-400 shrink-0" /> Unlimited AI Conversations
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-purple-400 shrink-0" /> FLUX.1 & SDXL Image Studio
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-cyan-400 shrink-0" /> Document & Code RAG Attachments
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-purple-400 shrink-0" /> Private Isolated History & Sync
              </div>
            </div>

            {subscription?.is_subscribed && (
              <div className="text-xs text-emerald-400 font-medium pt-1 flex items-center gap-1.5">
                <ShieldCheck size={14} /> Current Subscription: {subscription.days_left} days remaining. Adding ₹20 will extend by +15 days.
              </div>
            )}
          </div>

          {/* Payment Method Switcher Tabs */}
          <div className="flex bg-[#151c2e] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => { setMethod('upi'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
                method === 'upi'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <QrCode size={15} /> Instant UPI / QR Scan
            </button>
            <button
              onClick={() => { setMethod('razorpay'); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
                method === 'razorpay'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard size={15} /> Razorpay Checkout
            </button>
          </div>

          {/* Error / Success Alerts */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <X size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Tab 1: UPI Direct QR Code */}
          {method === 'upi' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                  <img src={upiQrUrl} alt="UPI QR Code" className="w-28 h-28 object-contain" />
                </div>
                <div className="space-y-2 text-xs text-gray-300 flex-1">
                  <div className="font-semibold text-white">Scan & Pay ₹20 via Any UPI App:</div>
                  <div className="text-[11px] text-gray-400">
                    Google Pay, PhonePe, Paytm, BHIM, Cred, or Mobile Banking.
                  </div>
                  <div className="flex items-center gap-2 bg-gray-950 p-2 rounded-lg border border-gray-800 font-mono text-[11px]">
                    <span className="text-cyan-300 truncate">{upiId}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="ml-auto p-1 text-gray-400 hover:text-white transition-colors"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* UTR Input Form */}
              <form onSubmit={handleUpiSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Enter UPI Reference / UTR Transaction ID (after paying ₹20):
                  </label>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 423892837492 or UTR number"
                    className="w-full bg-[#151c2e] border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !utrNumber.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Activate 15-Day Pass</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Razorpay Online Payment */}
          {method === 'razorpay' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 text-xs text-gray-300 space-y-2">
                <div className="font-semibold text-white">Instant Automated Checkout:</div>
                <p className="text-[11px] text-gray-400">
                  Pay ₹20 securely using Credit/Debit Cards, UPI, Netbanking, or Wallets via Razorpay gateway.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRazorpayCheckout}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={15} />
                    <span>Pay ₹20 Now with Razorpay</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-800/80 bg-gray-900/40 text-[10px] text-gray-500 text-center">
          🔒 Secure 256-bit encrypted transaction • Instant 15-day activation
        </div>
      </div>
    </div>
  );
}
