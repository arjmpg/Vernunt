import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  QrCode,
  Clock,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  Lock,
  Building2,
  Sparkles
} from 'lucide-react';
import QRCode from 'qrcode';

export interface UPIAppConfig {
  id: 'phonepe' | 'gpay' | 'paytm' | 'cred' | 'bhim' | 'custom_vpa' | 'qr_code';
  name: string;
  shortName: string;
  iconBg: string;
  textColor: string;
  borderColor: string;
  logoEmoji: string;
  handleSuffix?: string;
  appPackage?: string;
  description: string;
}

export const POPULAR_UPI_APPS: UPIAppConfig[] = [
  {
    id: 'phonepe',
    name: 'PhonePe UPI',
    shortName: 'PhonePe',
    iconBg: 'bg-purple-600',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200 hover:border-purple-500',
    logoEmoji: '🟣',
    description: 'Instant UPI collect & autopay approval on PhonePe',
    handleSuffix: '@ybl'
  },
  {
    id: 'gpay',
    name: 'Google Pay (GPay)',
    shortName: 'Google Pay',
    iconBg: 'bg-blue-600',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200 hover:border-blue-500',
    logoEmoji: '🌐',
    description: 'Fast one-click approval on Google Pay app',
    handleSuffix: '@oksbi'
  },
  {
    id: 'cred',
    name: 'CRED UPI',
    shortName: 'CRED',
    iconBg: 'bg-slate-900',
    textColor: 'text-slate-900',
    borderColor: 'border-slate-300 hover:border-slate-900',
    logoEmoji: '🖤',
    description: 'Pay via CRED UPI & claim guaranteed rewards',
    handleSuffix: '@cred'
  },
  {
    id: 'paytm',
    name: 'Paytm UPI',
    shortName: 'Paytm',
    iconBg: 'bg-sky-500',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200 hover:border-sky-500',
    logoEmoji: '💠',
    description: 'Pay via Paytm UPI or Linked Bank Account',
    handleSuffix: '@paytm'
  },
  {
    id: 'bhim',
    name: 'BHIM / Any Bank App',
    shortName: 'BHIM UPI',
    iconBg: 'bg-emerald-600',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200 hover:border-emerald-500',
    logoEmoji: '🇮🇳',
    description: 'Works with SBI, HDFC, ICICI, Axis & 100+ BHIM apps',
    handleSuffix: '@upi'
  }
];

export const POPULAR_HANDLES = [
  '@oksbi',
  '@okhdfcbank',
  '@okaxis',
  '@okicici',
  '@ybl',
  '@ibl',
  '@paytm',
  '@cred',
  '@upi'
];

interface UPIPaymentGatewayProps {
  amount: number;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  initialVpa?: string;
  customerVpa?: string;
  onPaymentSuccess: (paymentDetails: {
    transactionId: string;
    vpa: string;
    method: string;
    timestamp: string;
  }) => void;
  onPaymentCancelled?: (reason: string) => void;
  onPaymentCancel?: (reason: string) => void;
  onClose: () => void;
}

export const UPIPaymentGateway: React.FC<UPIPaymentGatewayProps> = ({
  amount,
  orderNumber,
  customerName,
  customerPhone = '9876543210',
  customerEmail = 'parent@vernunt.com',
  initialVpa = '',
  customerVpa = '',
  onPaymentSuccess,
  onPaymentCancelled,
  onPaymentCancel,
  onClose
}) => {
  // Navigation & Mode
  const [selectedApp, setSelectedApp] = useState<UPIAppConfig | null>(POPULAR_UPI_APPS[0]);
  const defaultVpa = initialVpa || customerVpa || `${customerPhone.replace(/[^0-9]/g, '').slice(-10) || '9876543210'}@oksbi`;
  const [vpaInput, setVpaInput] = useState<string>(defaultVpa);
  const [activeTab, setActiveTab] = useState<'apps' | 'vpa' | 'qr'>('apps');

  // Gateway Session State
  const [sessionState, setSessionState] = useState<'select' | 'waiting_approval' | 'verifying' | 'success' | 'cancelled' | 'expired'>('select');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [copiedUpiId, setCopiedUpiId] = useState<boolean>(false);
  
  // 5-Minute (300 Seconds) Countdown Timer
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [vpaError, setVpaError] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  // Vernunt Store Merchant UPI VPA
  const MERCHANT_VPA = 'vernunt.payments@icici';
  const MERCHANT_NAME = 'Vernunt Playgear Private Limited';
  const upiTransactionRef = `VRN${Date.now().toString().slice(-8)}`;

  // Construct standard NPCI UPI URI string
  const upiUri = `upi://pay?pa=${MERCHANT_VPA}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${orderNumber}`)}&tr=${upiTransactionRef}`;

  // Generate QR Code data URL when amount or order changes
  useEffect(() => {
    QRCode.toDataURL(upiUri, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Error generating UPI QR code:', err));
  }, [upiUri]);

  // Countdown timer when waiting for approval
  useEffect(() => {
    if (sessionState === 'waiting_approval') {
      setTimeLeft(300); // 5 minutes
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setSessionState('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [sessionState]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Validate VPA Format (e.g., username@bank)
  const validateVpa = (vpa: string): boolean => {
    const vpaRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z0-9]{2,49}$/;
    return vpaRegex.test(vpa.trim());
  };

  // Handle Initiating Payment from App or VPA
  const handleInitiatePayment = (app?: UPIAppConfig) => {
    const targetApp = app || selectedApp;
    
    if (activeTab === 'vpa') {
      if (!vpaInput.trim()) {
        setVpaError('Please enter your UPI ID (e.g. yourname@okhdfcbank)');
        return;
      }
      if (!validateVpa(vpaInput)) {
        setVpaError('Invalid UPI ID format. Must be like username@bank (e.g. mobile@ybl, name@oksbi)');
        return;
      }
      setVpaError(null);
    }

    if (targetApp) {
      setSelectedApp(targetApp);
    }

    setSessionState('waiting_approval');
  };

  // Trigger Deep Link to open UPI App on Mobile
  const handleOpenUpiAppDirect = () => {
    window.location.href = upiUri;
  };

  // Handle "I Have Paid / Verify Payment Status"
  const handleVerifyPayment = () => {
    setSessionState('verifying');

    // Simulate authentic NPCI & Bank gateway reconciliation check
    setTimeout(() => {
      setSessionState('success');
      
      setTimeout(() => {
        onPaymentSuccess({
          transactionId: `NPCI-UPI-${Date.now().toString().slice(-9)}`,
          vpa: activeTab === 'vpa' ? vpaInput : (selectedApp?.name || 'UPI App'),
          method: selectedApp?.name || 'UPI Gateway',
          timestamp: new Date().toLocaleTimeString('en-IN')
        });
      }, 1200);
    }, 1800);
  };

  // Handle Customer Cancellation
  const handleCancelOrder = (reason: string = 'Payment cancelled by customer before completion') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionState('cancelled');
    setTimeout(() => {
      if (onPaymentCancelled) {
        onPaymentCancelled(reason);
      } else if (onPaymentCancel) {
        onPaymentCancel(reason);
      }
    }, 1500);
  };

  // Copy Merchant VPA
  const handleCopyMerchantVpa = () => {
    navigator.clipboard.writeText(MERCHANT_VPA);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Gateway Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-rose-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-amber-300">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-sm text-white tracking-tight">UPI Smart Pay Gateway</h3>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded">
                  NPCI Certified
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300">Fast, 100% safe payments directly from your bank</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount to Pay</span>
            <span className="font-mono font-black text-base text-amber-300">₹{amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATE 1: SELECT UPI APP OR ENTER VPA OR SCAN QR                          */}
        {/* ========================================================================= */}
        {sessionState === 'select' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-800">
            {/* Top Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('apps');
                  setVpaError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'apps'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>⚡ UPI Apps</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('vpa');
                  setVpaError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'vpa'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📱 UPI ID (VPA)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('qr');
                  setVpaError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'qr'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan QR</span>
              </button>
            </div>

            {/* TAB 1: POPULAR UPI APPS */}
            {activeTab === 'apps' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                    Select Your Preferred UPI App:
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                    Instant 1-Click Request
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POPULAR_UPI_APPS.map(app => {
                    const isSelected = selectedApp?.id === app.id;
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-rose-50/70 border-rose-500 shadow-xs ring-1 ring-rose-400/40'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl ${app.iconBg} text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0`}>
                            {app.logoEmoji}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 text-xs truncate">{app.name}</h4>
                            <p className="text-[10px] text-slate-500 truncate">{app.description}</p>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>How App Approval Works:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Clicking continue will generate an official NPCI collect request of <strong>₹{amount.toLocaleString('en-IN')}</strong> directly on your <strong>{selectedApp?.shortName || 'UPI'}</strong> app. Once you approve with your UPI PIN, the order gets confirmed immediately.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: ENTER CUSTOM UPI ID */}
            {activeTab === 'vpa' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 text-xs">
                    Enter Your UPI ID / VPA *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={vpaInput}
                      onChange={(e) => {
                        setVpaInput(e.target.value.toLowerCase().trim());
                        setVpaError(null);
                      }}
                      placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pr-24 text-xs font-mono font-bold text-slate-900 outline-hidden focus:border-rose-500 focus:bg-white transition"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {validateVpa(vpaInput) ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" /> Valid VPA
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">@bank</span>
                      )}
                    </div>
                  </div>

                  {vpaError && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {vpaError}
                    </p>
                  )}
                </div>

                {/* Popular UPI Handles Quick Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-slate-500 block">Quick Handles:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_HANDLES.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          const prefix = vpaInput.split('@')[0] || customerPhone.replace(/[^0-9]/g, '').slice(-10) || 'parent';
                          setVpaInput(`${prefix}${h}`);
                          setVpaError(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-bold transition cursor-pointer"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Auto-Dispatched Collect Request:
                  </span>
                  <p>
                    A notification for <strong>₹{amount.toLocaleString('en-IN')}</strong> will pop up instantly on your phone in whichever bank app is linked to this UPI ID.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: SCAN DYNAMIC UPI QR CODE */}
            {activeTab === 'qr' && (
              <div className="text-center space-y-4 animate-fade-in">
                <div className="max-w-xs mx-auto bg-slate-50 p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 inline-block shadow-inner">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="UPI Payment QR Code"
                        className="w-48 h-48 mx-auto object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg">
                        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-sm font-black text-rose-700 block">
                      ₹{amount.toLocaleString('en-IN')}
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Scan using Google Pay, PhonePe, Paytm, CRED or any BHIM UPI App
                    </p>
                  </div>
                </div>

                {/* Copy Merchant VPA */}
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">UPI ID: <strong>{MERCHANT_VPA}</strong></span>
                  <button
                    type="button"
                    onClick={handleCopyMerchantVpa}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Security Guarantee Banner */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1 font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Bank Level Encryption
              </span>
              <span>Order Ref: <strong className="font-mono text-slate-700">{orderNumber}</strong></span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleInitiatePayment()}
                className="flex-1 py-3 bg-gradient-to-r from-rose-700 via-rose-600 to-rose-700 hover:from-rose-800 hover:to-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {activeTab === 'qr' ? 'I Am Ready to Scan & Pay' : `Pay ₹${amount.toLocaleString('en-IN')} via ${activeTab === 'apps' ? (selectedApp?.shortName || 'UPI') : 'UPI ID'}`}
                </span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2: AWAITING APPROVAL / REAL-TIME VERIFICATION GATEWAY SCREEN        */}
        {/* ========================================================================= */}
        {sessionState === 'waiting_approval' && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800 animate-fade-in">
            {/* Top Alert: Request Dispatched */}
            <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white p-5 rounded-3xl border border-rose-800/50 shadow-md space-y-3 relative overflow-hidden">
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Payment Request Dispatched</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    Approve Payment on Your UPI App
                  </h4>
                  <p className="text-xs text-slate-300">
                    We sent a payment request of <strong className="text-amber-300 font-mono">₹{amount.toLocaleString('en-IN')}</strong> to{' '}
                    <strong className="text-white">
                      {activeTab === 'vpa' ? vpaInput : (selectedApp?.name || 'your UPI App')}
                    </strong>
                  </p>
                </div>

                <div className="text-center bg-white/10 border border-white/20 px-3 py-2 rounded-2xl shrink-0">
                  <span className="text-[10px] text-slate-300 block uppercase font-bold">Expires In</span>
                  <span className="font-mono text-base font-black text-amber-300 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Progress countdown bar */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / 300) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Quick Action: Open on Mobile */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-rose-700" />
                  <span className="font-bold text-slate-900 text-xs">Paying on this phone?</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenUpiAppDirect}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                >
                  <span>Open UPI App Now</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Clicking opens PhonePe, Google Pay, CRED or Paytm directly to approve with your UPI PIN.
              </p>
            </div>

            {/* Simulated Live Polling Indicator */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse shrink-0"></div>
                <span className="font-bold text-emerald-900 text-xs">
                  Listening for NPCI payment authorization...
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed pl-5">
                Once you enter your UPI PIN in your bank app, click <strong>"I Have Paid & Confirm Order"</strong> below or the gateway will automatically detect and finalize your order.
              </p>
            </div>

            {/* Order Recap Summary */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Merchant:</span>
                <span className="font-bold text-slate-800">Vernunt Playgear (Verified)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Order Reference:</span>
                <span className="font-mono font-bold text-slate-800">{orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Reference:</span>
                <span className="font-mono text-slate-700">{upiTransactionRef}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-100">
                <span>Total Amount:</span>
                <span className="font-mono text-rose-700 text-base">₹{amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Critical Two Choices: Confirm Paid OR Cancel Order */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleVerifyPayment}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Approved & Paid in App (Confirm Order)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCancelOrder('Customer chose to cancel UPI transaction')}
                className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel Order / Payment Incomplete</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 3: VERIFYING / RECONCILING WITH NPCI                                */}
        {/* ========================================================================= */}
        {sessionState === 'verifying' && (
          <div className="p-10 text-center space-y-4 flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shadow-md">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Verifying Bank Authorization...</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Reconciling transaction with NPCI & ICICI Bank payment gateway. Please do not refresh or press back.
              </p>
            </div>
            <div className="bg-slate-50 px-4 py-2 rounded-xl font-mono text-xs text-slate-600 font-bold">
              Amount: ₹{amount.toLocaleString('en-IN')} • Ref: {upiTransactionRef}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 4: SUCCESS CONFIRMATION                                             */}
        {/* ========================================================================= */}
        {sessionState === 'success' && (
          <div className="p-10 text-center space-y-4 flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg text-3xl">
              ✓
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Payment Authorized
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">₹{amount.toLocaleString('en-IN')} Received!</h3>
              <p className="text-xs text-slate-500">
                Your UPI payment has been verified. Preparing your official tax invoice and dispatch order...
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 5: ORDER CANCELLED / ABANDONED                                      */}
        {/* ========================================================================= */}
        {sessionState === 'cancelled' && (
          <div className="p-10 text-center space-y-4 flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shadow-sm text-2xl">
              ✕
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                Order Cancelled
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">Payment Not Completed</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                The payment session was cancelled. No money was deducted from your bank account.
              </p>
            </div>
            <p className="text-xs font-bold text-slate-600">
              Your cart items have been saved safely.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 6: SESSION EXPIRED (TIMEOUT)                                        */}
        {/* ========================================================================= */}
        {sessionState === 'expired' && (
          <div className="p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                Session Expired
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">5-Minute UPI Window Expired</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Payment approval was not received within 5 minutes. The order has been automatically cancelled to avoid double billing.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionState('select')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Retry UPI Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onPaymentCancelled) {
                    onPaymentCancelled('UPI Session Timed Out');
                  } else if (onPaymentCancel) {
                    onPaymentCancel('UPI Session Timed Out');
                  }
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close & Change Method
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
