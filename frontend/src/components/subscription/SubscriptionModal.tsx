import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, QrCode, ArrowRight, ShieldCheck, Loader2, Copy } from 'lucide-react';
import { createUpiOrderApi, verifyUpiPaymentApi, getSubscriptionStatusApi, type SubscriptionStatus } from '../../services/api';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  onSubscriptionUpdated?: () => void;
}

export function SubscriptionModal({ isOpen, onClose, user, onSubscriptionUpdated }: SubscriptionModalProps) {
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<{
    order_id: string;
    amount_inr: number;
    upi_id: string;
    upi_intent_url: string;
    qr_code_url: string;
  } | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await getSubscriptionStatusApi();
      setSubStatus(res);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartUpgrade = async () => {
    setIsLoading(true);
    setVerifyError(null);
    try {
      const order = await createUpiOrderApi('15-Day Pass');
      setOrderData(order);
    } catch (e: any) {
      setVerifyError(e.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData || !utrNumber.trim()) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await verifyUpiPaymentApi({
        order_id: orderData.order_id,
        utr_number: utrNumber.trim(),
        amount: orderData.amount_inr,
      });
      if (res.success || res.is_subscribed) {
        setVerifySuccess(true);
        if (onSubscriptionUpdated) onSubscriptionUpdated();
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed. Please check the UTR / Ref ID.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade">
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl p-6 sm:p-7 text-[var(--foreground)] animate-scale overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-secondary)] transition-colors"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 flex items-center justify-center font-bold">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              Asura 15-Day Pass
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Unlock frontier throughput, unlimited Stitch UI synthesis & agent runs.
            </p>
          </div>
        </div>

        {/* Status card */}
        {subStatus && (
          <div className="my-4 p-3.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between text-xs">
            <div>
              <span className="text-[var(--muted-foreground)]">Current status: </span>
              <span className="font-semibold text-[var(--foreground)]">
                {subStatus.is_subscribed ? `${subStatus.plan_name} (${subStatus.days_left} days left)` : 'Free Plan'}
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                subStatus.is_subscribed
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20'
              }`}
            >
              {subStatus.is_subscribed ? 'Active' : 'Free tier'}
            </span>
          </div>
        )}

        {/* Plan Details & Features */}
        {!orderData && !verifySuccess && (
          <div className="space-y-4 my-4">
            <div className="p-4 rounded-2xl bg-neutral-900 text-white dark:bg-neutral-800 border border-neutral-800 dark:border-neutral-700 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">15-Day Full Access</div>
                <div className="text-2xl font-bold mt-0.5">₹20 <span className="text-xs font-normal text-neutral-400">/ 15 days</span></div>
                <div className="text-[11px] text-neutral-400 mt-1">Instant activation via UPI / GPay / PhonePe / Paytm</div>
              </div>
              <button
                onClick={handleStartUpgrade}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-neutral-950 text-xs font-bold hover:bg-cyan-400 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <>Get Pass <ArrowRight size={13} /></>}
              </button>
            </div>

            <div className="space-y-2 text-xs text-[var(--muted-foreground)]">
              {[
                'Full access to Cretivra 1, 1.1, 1.2, Coder Pro, and Reason models',
                'Unlimited Stitch UI Synthesis and code exports (HTML/JSX/ZIP)',
                'Autonomous multi-step DAG Agent execution workspaces',
                'Visual Diffusion Studio (FLUX.1 Art & SDXL Studio)',
                'Priority execution with zero queuing delays',
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/15 text-cyan-500 flex items-center justify-center shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className="text-[var(--foreground)]">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment QR & UTR form */}
        {orderData && !verifySuccess && (
          <div className="space-y-4 my-3 animate-fade">
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)]">
              {orderData.qr_code_url && (
                <div className="p-2 bg-white rounded-xl shadow-xs shrink-0">
                  <img
                    src={orderData.qr_code_url}
                    alt="UPI QR Code"
                    className="w-28 h-28 object-contain"
                  />
                </div>
              )}
              <div className="space-y-1.5 text-xs text-[var(--foreground)] w-full">
                <div className="font-semibold text-sm">Scan to pay ₹{orderData.amount_inr}</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">
                  Use any UPI app (GPay, PhonePe, Paytm, BHIM).
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-[11px]">
                  <span>{orderData.upi_id}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(orderData.upi_id);
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="text-cyan-500 hover:text-cyan-400 p-0.5"
                    title="Copy UPI ID"
                  >
                    {copiedUpi ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--foreground)] mb-1">
                  12-digit UPI Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 428719283741 or Ref No."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {verifyError && (
                <div className="text-xs text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {verifyError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOrderData(null)}
                  className="px-3 py-2 rounded-xl text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || !utrNumber.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-neutral-950 text-xs font-semibold hover:bg-cyan-400 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Verifying UTR...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Verify & Activate Pass</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Verification Success */}
        {verifySuccess && (
          <div className="text-center py-8 space-y-3 animate-fade">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Pass Activated Successfully!</h3>
            <p className="text-xs text-[var(--muted-foreground)]">
              Your Asura 15-Day Pass is active. Enjoy unlimited access.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
