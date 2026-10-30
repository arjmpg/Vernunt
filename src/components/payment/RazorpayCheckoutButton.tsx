import React, { useState } from 'react';
import { CreditCard, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  openRazorpayCheckout,
  type RazorpaySuccessResponse,
  type RazorpayVerifyResponse
} from '../../utils/razorpay.ts';

export interface RazorpayCheckoutButtonProps {
  amountInRupees?: number;
  amountInPaise?: number;
  receipt?: string;
  name?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: Record<string, string>;
  buttonText?: string;
  className?: string;
  disabled?: boolean;
  onSuccess?: (verifyResult: RazorpayVerifyResponse, paymentResponse: RazorpaySuccessResponse) => void;
  onError?: (error: any) => void;
  onDismiss?: () => void;
  showIcon?: boolean;
}

export const RazorpayCheckoutButton: React.FC<RazorpayCheckoutButtonProps> = ({
  amountInRupees,
  amountInPaise,
  receipt,
  name = 'Vernunt',
  description = 'Verified Child Products & Playtime',
  customerName,
  customerEmail,
  customerPhone,
  notes,
  buttonText,
  className,
  disabled = false,
  onSuccess,
  onError,
  onDismiss,
  showIcon = true,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compute amount in paise (minimum 100 paise = ₹1.00)
  const finalPaise = amountInPaise !== undefined 
    ? Math.round(amountInPaise) 
    : Math.round((amountInRupees || 1) * 100);

  const displayAmount = (finalPaise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });

  const handleCheckoutClick = async () => {
    if (disabled || isProcessing) return;

    if (finalPaise < 100) {
      setStatusMessage({
        type: 'error',
        text: 'Minimum amount for Razorpay checkout is ₹1.00 (100 paise).',
      });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    await openRazorpayCheckout({
      amountInPaise: finalPaise,
      currency: 'INR',
      name,
      description: `${description} (${displayAmount})`,
      receipt: receipt || `rcpt_vernunt_${Date.now()}`,
      notes: notes || {},
      customer: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      onSuccess: (verifyResult, paymentResponse) => {
        setIsProcessing(false);
        setStatusMessage({
          type: 'success',
          text: `Payment successful! Payment ID: ${paymentResponse.razorpay_payment_id}`,
        });
        if (onSuccess) {
          onSuccess(verifyResult, paymentResponse);
        }
      },
      onError: (err) => {
        setIsProcessing(false);
        const errorText = err?.description || err?.message || 'Payment was unsuccessful or encountered an error.';
        setStatusMessage({
          type: 'error',
          text: errorText,
        });
        if (onError) {
          onError(err);
        }
      },
      onDismiss: () => {
        setIsProcessing(false);
        console.log('[Razorpay Button] Modal dismissed by parent');
        if (onDismiss) {
          onDismiss();
        }
      },
    });
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        disabled={disabled || isProcessing}
        onClick={handleCheckoutClick}
        className={
          className ||
          'w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-rose-700 hover:from-blue-800 hover:to-rose-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50'
        }
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Connecting to Razorpay...</span>
          </>
        ) : (
          <>
            {showIcon && <CreditCard className="w-4 h-4 shrink-0 text-amber-300" />}
            <span>
              {buttonText || `Pay with Razorpay • ${displayAmount}`}
            </span>
            <Lock className="w-3.5 h-3.5 ml-1 text-white/80 shrink-0" />
          </>
        )}
      </button>

      {/* Trust & Security Microcopy */}
      <div className="flex items-center justify-center gap-2 text-[10.5px] text-slate-500 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Razorpay Standard Web Checkout (Cards, UPI, NetBanking, Wallets)</span>
      </div>

      {/* Status announcement */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              : 'bg-rose-50 text-rose-900 border border-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="leading-snug">{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
};
