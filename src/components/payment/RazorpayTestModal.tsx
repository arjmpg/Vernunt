import React, { useState } from 'react';
import { CreditCard, X, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { RazorpayCheckoutButton } from './RazorpayCheckoutButton.tsx';
import type { RazorpaySuccessResponse, RazorpayVerifyResponse } from '../../utils/razorpay.ts';

export interface RazorpayTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmountRupees?: number;
}

export const RazorpayTestModal: React.FC<RazorpayTestModalProps> = ({
  isOpen,
  onClose,
  defaultAmountRupees = 10,
}) => {
  const [testAmount, setTestAmount] = useState<number>(defaultAmountRupees);
  const [customerName, setCustomerName] = useState('Parent Tester');
  const [customerEmail, setCustomerEmail] = useState('parent.tester@vernunt.com');
  const [customerPhone, setCustomerPhone] = useState('9876543210');
  const [verificationResult, setVerificationResult] = useState<{
    verifyResult: RazorpayVerifyResponse;
    paymentResponse: RazorpaySuccessResponse;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fade-in text-left">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-white flex items-center justify-center font-bold text-lg border border-blue-400/30">
              💳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black font-serif">
                  Razorpay Standard Web Checkout
                </h3>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Test Mode
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Backend Order Creation &amp; HMAC-SHA256 Signature Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Credentials Info Badge */}
          <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-blue-950">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Active Razorpay Test Gateway
              </span>
              <span className="font-mono text-[10.5px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md">
                rzp_test_TuCX...
              </span>
            </div>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              Standard Web Checkout with server-side <code className="font-mono font-bold bg-white px-1 py-0.5 rounded">POST /api/create-order</code> and signature validation at <code className="font-mono font-bold bg-white px-1 py-0.5 rounded">POST /api/verify-payment</code>.
            </p>
          </div>

          {/* Test Amount Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Select or Enter Test Amount:
            </label>
            <div className="flex items-center gap-2">
              {[1, 10, 99, 499].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTestAmount(amt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    testAmount === amt
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:bg-white focus:outline-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Customer Name:</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Contact Number:</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-bold text-slate-700">Customer Email:</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
            />
          </div>

          {/* Success Verification Card */}
          {verificationResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2 animate-fade-in text-xs">
              <div className="flex items-center justify-between text-emerald-950 font-black">
                <span className="flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Payment Verified Successfully!
                </span>
                <span className="bg-emerald-600 text-white font-mono text-[10px] px-2 py-0.5 rounded-full">
                  HMAC MATCH
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200 font-mono text-[11px] space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="font-bold text-slate-900">{verificationResult.paymentResponse.razorpay_payment_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-bold text-slate-900">{verificationResult.paymentResponse.razorpay_order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-bold text-emerald-700">₹{testAmount}</span>
                </div>
              </div>
              <p className="text-[10.5px] text-emerald-800">
                Server signature match verified via <code className="font-bold">/api/verify-payment</code>.
              </p>
            </div>
          )}

          {/* Error Message Card */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-900 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Checkout Notice:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Primary Razorpay Checkout Button */}
          <div className="pt-2">
            <RazorpayCheckoutButton
              amountInRupees={testAmount}
              customerName={customerName}
              customerEmail={customerEmail}
              customerPhone={customerPhone}
              description={`Test Checkout (${customerName})`}
              receipt={`test_rcpt_${Date.now()}`}
              buttonText={`Pay ₹${testAmount.toLocaleString('en-IN')} with Razorpay`}
              onSuccess={(verifyResult, paymentResponse) => {
                setVerificationResult({ verifyResult, paymentResponse });
                setErrorMessage(null);
              }}
              onError={(err) => {
                setErrorMessage(err?.description || err?.message || 'Payment failed or was cancelled.');
              }}
              onDismiss={() => {
                setErrorMessage('Payment modal was dismissed by the user.');
              }}
            />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Powered by Razorpay Standard Web Checkout</span>
            <button
              type="button"
              onClick={onClose}
              className="font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
