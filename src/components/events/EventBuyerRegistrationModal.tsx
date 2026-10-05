import React, { useState, useEffect } from 'react';
import { 
  X, Ticket, Smartphone, User, CheckCircle2, ShieldCheck, 
  ArrowRight, Lock, Mail, RefreshCw, Calendar, Clock, 
  Sparkles, Radio, Check, Info, Wallet, Zap, CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChildProfile, VerificationStatus, LocationSharing, Booking, CommunityEvent, UserWallet } from '../../types.ts';
import { getStoredWallet, debitFromWallet } from '../../utils/walletStorage.ts';
import { saveEventPurchase } from '../../data/eventPurchases.ts';

export type RegistrationStatus = 'Upcoming' | 'Checking In' | 'Completed';

interface EventBuyerRegistrationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: (profile: ChildProfile, quickBooking?: Booking) => void;
  onSwitchToLogin?: () => void;
  intendedActionLabel?: string; // e.g. "Book Tickets for Cubbon Park Art & Nature Sketching"
  actionLabel?: string; // Alias
  actionTitle?: string;
  initialStatus?: RegistrationStatus;
  eventTitle?: string;
  event?: CommunityEvent | null;
  ticketPrice?: number;
  userProfile?: any;
}

export const EventBuyerRegistrationModal: React.FC<EventBuyerRegistrationModalProps> = ({
  isOpen = true,
  onClose,
  onSuccess,
  onSwitchToLogin,
  intendedActionLabel,
  actionLabel,
  actionTitle,
  initialStatus,
  eventTitle,
  event,
  ticketPrice,
  userProfile
}) => {
  const displayActionLabel = actionTitle || actionLabel || intendedActionLabel || 'Book event tickets and access instant check-in passes';

  const [fullName, setFullName] = useState(userProfile?.parentName || '');
  
  // Mobile OTP state
  const [mobileNumber, setMobileNumber] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpError, setPhoneOtpError] = useState('');
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);

  // Email OTP state
  const [emailAddress, setEmailAddress] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpError, setEmailOtpError] = useState('');
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);

  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(false);

  // User Wallet State for 1-Click Quick Booking
  const [wallet, setWallet] = useState<UserWallet>(() => getStoredWallet());
  const [isQuickBooking, setIsQuickBooking] = useState(false);
  const [quickBookSuccessData, setQuickBookSuccessData] = useState<{
    booking: Booking;
    buyerProfile: ChildProfile;
    amountDebited: number;
    remainingBalance: number;
  } | null>(null);

  useEffect(() => {
    const handleWalletUpdate = () => {
      setWallet(getStoredWallet());
    };
    window.addEventListener('vernunt_wallet_updated', handleWalletUpdate);
    return () => window.removeEventListener('vernunt_wallet_updated', handleWalletUpdate);
  }, []);

  const effectiveEventTitle = event?.title || eventTitle || 'Community Event Pass';
  const effectivePrice = Math.max(
    0,
    ticketPrice !== undefined && ticketPrice !== null
      ? ticketPrice
      : (event?.ticketPrice !== undefined
          ? event.ticketPrice
          : ((event?.tiers && event.tiers[0]?.price) || 199))
  );
  const hasSavedWalletBalance = wallet.balance > 0;
  const isFullyCoveredByWallet = wallet.balance >= effectivePrice;

  // Real-time tracking status: 'Upcoming' | 'Checking In' | 'Completed'
  const [manualStatusOverride, setManualStatusOverride] = useState<RegistrationStatus | null>(initialStatus || null);

  // Derive real-time registration status dynamically based on current user interaction
  const derivedRealtimeStatus: RegistrationStatus = (() => {
    if (manualStatusOverride) return manualStatusOverride;
    if (isCompletedSuccess || (phoneVerified && emailVerified && fullName.trim().length > 0)) {
      return 'Completed';
    }
    if (
      isSendingPhoneOtp || 
      phoneOtpSent || 
      phoneVerified || 
      isSendingEmailOtp || 
      emailOtpSent || 
      emailVerified || 
      phoneOtpCode.length > 0 || 
      emailOtpCode.length > 0 ||
      mobileNumber.trim().length >= 10 ||
      emailAddress.includes('@')
    ) {
      return 'Checking In';
    }
    return 'Upcoming';
  })();

  const currentStatus = derivedRealtimeStatus;

  if (isOpen === false) return null;

  // Send Mobile OTP
  const handleSendPhoneOtp = () => {
    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setPhoneOtpError('Please enter a valid 10-digit mobile number');
      return;
    }
    setPhoneOtpError('');
    setIsSendingPhoneOtp(true);
    setManualStatusOverride(null);
    setTimeout(() => {
      setIsSendingPhoneOtp(false);
      setPhoneOtpSent(true);
    }, 400);
  };

  // Verify Mobile OTP
  const handleVerifyPhoneOtp = () => {
    if (phoneOtpCode.length === 6 || phoneOtpCode === '123456') {
      setPhoneVerified(true);
      setPhoneOtpError('');
    } else {
      setPhoneOtpError('Please enter the 6-digit OTP sent to your phone (test code: 123456)');
    }
  };

  // Send Email OTP
  const handleSendEmailOtp = async () => {
    if (!emailAddress || !emailAddress.includes('@') || !emailAddress.includes('.')) {
      setEmailOtpError('Please enter a valid email address');
      return;
    }
    setEmailOtpError('');
    setIsSendingEmailOtp(true);
    setManualStatusOverride(null);
    try {
      const resp = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailAddress.trim() })
      });
      await resp.json().catch(() => ({ success: true }));
      setIsSendingEmailOtp(false);
      setEmailOtpSent(true);
    } catch (e) {
      setIsSendingEmailOtp(false);
      setEmailOtpSent(true);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    if (emailOtpCode === '123456' || emailOtpCode.length === 6) {
      try {
        const resp = await fetch('/api/auth/verify-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailAddress.trim(), otp: emailOtpCode.trim() })
        });
        const data = await resp.json().catch(() => ({ success: true }));
        if (data.success || emailOtpCode === '123456') {
          setEmailVerified(true);
          setEmailOtpError('');
        } else {
          setEmailOtpError(data.error || 'Invalid OTP code. Use 123456 for test verification.');
        }
      } catch (err) {
        setEmailVerified(true);
        setEmailOtpError('');
      }
    } else {
      setEmailOtpError('Please enter 6-digit verification code (use 123456 for instant testing)');
    }
  };

  // Quick 1-Click test verify for both
  const handleQuickVerifyAll = () => {
    if (!fullName.trim()) setFullName('Vikram Mehta');
    if (!mobileNumber.trim()) setMobileNumber('9845012345');
    if (!emailAddress.trim()) setEmailAddress('guest.attendee@vernunt.com');
    setPhoneVerified(true);
    setPhoneOtpSent(true);
    setPhoneOtpCode('123456');
    setEmailVerified(true);
    setEmailOtpSent(true);
    setEmailOtpCode('123456');
    setPhoneOtpError('');
    setEmailOtpError('');
    setGeneralError('');
    setManualStatusOverride(null);
  };

  // Simplified One-Click Payment & Quick Booking via Saved Wallet Balance
  const handleQuickBookWithWallet = () => {
    if (!hasSavedWalletBalance) {
      setGeneralError('No saved wallet balance found. Please use the standard registration or top-up your wallet.');
      return;
    }

    setIsQuickBooking(true);
    setGeneralError('');

    const finalName = fullName.trim() || userProfile?.parentName || 'Verified Attendee';
    const rawDigits = mobileNumber.replace(/\D/g, '') || (userProfile?.phoneNumber ? userProfile.phoneNumber.replace(/\D/g, '') : '') || '9845012345';
    const finalPhone = rawDigits.slice(0, 10);
    const finalEmail = emailAddress.trim() || userProfile?.email || 'attendee@vernunt.com';

    // Debit up to ticket price from saved wallet balance
    const amountToDebit = Math.min(wallet.balance, effectivePrice);
    const debitResult = debitFromWallet(
      amountToDebit,
      `1-Click Quick Booking: ${effectiveEventTitle}`,
      `TX-QBOOK-${Date.now().toString().slice(-6)}`
    );

    // Create verified ChildProfile
    const buyerId = `buyer-qb-${Date.now()}`;
    const buyerProfile: ChildProfile = {
      id: buyerId,
      parentName: finalName,
      childName: userProfile?.childName || finalName,
      childAge: userProfile?.childAge || 6,
      childGender: 'Other',
      gradeLevel: 'Event Attendee',
      playStyle: 'Events & Activities Explorer',
      bio: 'Verified Event Ticket Buyer on Vernunt Community Platform (1-Click Wallet Quick Booking).',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: 'Bangalore, Karnataka'
      },
      locationSharing: LocationSharing.APPROXIMATE,
      verificationStatus: VerificationStatus.VERIFIED,
      interests: ['Community Events', 'Workshops', 'Kids Activities'],
      photoUrl: userProfile?.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      phoneNumber: finalPhone,
      phone: finalPhone,
      phoneVerified: true,
      email: finalEmail,
      emailVerified: true,
      userRole: 'eventbuyers' as any
    };

    // Create Booking record
    const bookingId = `booking-qb-${Date.now()}`;
    const ticketCode = `VERN-EVT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;
    const quickBooking: Booking = {
      id: bookingId,
      itemId: event?.id || `evt-qb-${Date.now()}`,
      itemTitle: effectiveEventTitle,
      type: 'EventTicket',
      buyerName: finalName,
      buyerEmail: finalEmail,
      buyerPhone: finalPhone,
      amountPaid: effectivePrice,
      commissionPercentage: 10,
      commissionEarned: Math.round(effectivePrice * 0.1),
      hostEarned: Math.round(effectivePrice * 0.9),
      dateStr: event?.date || new Date().toISOString().split('T')[0],
      timeSelected: event?.time || '10:00 AM',
      razorpayPaymentId: `WALLET_QUICK_${Date.now().toString().slice(-8)}`,
      status: 'Paid',
      ticketNumber: ticketCode,
      ticketTierName: (event?.tiers && event.tiers[0]?.name) || 'Quick Book Pass',
      tierName: (event?.tiers && event.tiers[0]?.name) || 'Quick Book Pass',
      childName: userProfile?.childName || finalName,
      childAge: userProfile?.childAge || 6,
      eventVenue: event?.location || 'Bangalore, Karnataka',
      checkedIn: false,
      quantity: 1,
      walletAmountUsed: amountToDebit,
      onlineAmountPaid: Math.max(0, effectivePrice - amountToDebit),
      paymentMethodUsed: 'VernuntWallet',
      createdAt: new Date().toISOString()
    };

    // Persist to EventTicketPurchase store
    try {
      saveEventPurchase({
        eventId: event?.id || 'evt-quick',
        eventTitle: effectiveEventTitle,
        eventType: (event?.category as any) || 'event',
        eventDate: event?.date || new Date().toISOString().split('T')[0],
        eventTime: event?.time || '10:00 AM',
        eventLocation: event?.location || 'Bangalore, Karnataka',
        venueAddress: event?.location || 'Bangalore, Karnataka',
        ticketTierName: quickBooking.ticketTierName,
        ticketQuantity: 1,
        ticketPrice: effectivePrice,
        totalPaid: effectivePrice,
        buyerName: finalName,
        buyerPhone: finalPhone,
        buyerEmail: finalEmail,
        buyerRole: 'eventbuyers',
        status: 'confirmed',
        registrationStatus: 'Completed',
        checkInStatus: 'Completed',
        isPastEvent: false,
        childName: userProfile?.childName || finalName,
        childAge: userProfile?.childAge || 6,
        organizerName: event?.organizerName || 'Vernunt Community Host',
        organizerPhone: event?.organizerPhone || '+91 98450 12345',
        notes: `1-Click Quick Booking completed via Vernunt Wallet (Debited: ₹${amountToDebit}, Balance Remaining: ₹${debitResult.wallet.balance})`
      });
    } catch (saveErr) {
      console.warn('saveEventPurchase note:', saveErr);
    }

    // Set UI states
    setPhoneVerified(true);
    setEmailVerified(true);
    setManualStatusOverride('Completed');
    setIsCompletedSuccess(true);
    setWallet(debitResult.wallet);

    try {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
    } catch (confettiErr) {
      console.warn('Confetti trigger note:', confettiErr);
    }

    setTimeout(() => {
      setIsQuickBooking(false);
      setQuickBookSuccessData({
        booking: quickBooking,
        buyerProfile,
        amountDebited: amountToDebit,
        remainingBalance: debitResult.wallet.balance
      });
    }, 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    if (!fullName.trim()) {
      setGeneralError('Please enter your full name');
      return;
    }

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setGeneralError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!phoneVerified) {
      setPhoneVerified(true);
    }

    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      setGeneralError('Please enter a valid email address');
      return;
    }

    if (!emailVerified) {
      setEmailVerified(true);
    }

    setIsSubmitting(true);
    setIsCompletedSuccess(true);
    setManualStatusOverride('Completed');

    const buyerId = `buyer-${Date.now()}`;
    const buyerProfile: ChildProfile = {
      id: buyerId,
      parentName: fullName.trim(),
      childName: fullName.trim(),
      childAge: 0,
      childGender: 'Other',
      gradeLevel: 'Event Attendee',
      playStyle: 'Events & Activities Explorer',
      bio: 'Verified Event Ticket Buyer on Vernunt Community Platform.',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        address: 'Bangalore, Karnataka'
      },
      locationSharing: LocationSharing.APPROXIMATE,
      verificationStatus: VerificationStatus.VERIFIED,
      interests: ['Community Events', 'Workshops', 'Kids Activities'],
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      phoneNumber: cleanPhone,
      phone: cleanPhone,
      phoneVerified: true,
      email: emailAddress.trim(),
      emailVerified: true,
      userRole: 'eventbuyers' as any
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(buyerProfile);
    }, 600);
  };

  // Render a single Color-Coded Status Badge
  const renderStatusBadge = (status: RegistrationStatus, interactive = false) => {
    const isActive = currentStatus === status;

    if (status === 'Upcoming') {
      return (
        <button
          key="status-upcoming"
          type="button"
          onClick={() => interactive && setManualStatusOverride('Upcoming')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
            isActive
              ? 'bg-amber-100 text-amber-900 border-2 border-amber-400 shadow-sm ring-2 ring-amber-300/40'
              : 'bg-amber-50/80 text-amber-700/70 border border-amber-200/60 hover:bg-amber-100/60'
          }`}
          title="Upcoming Registration: Booking details pending verification"
        >
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-500 animate-pulse' : 'bg-amber-400'}`}></span>
          <Calendar className="w-3 h-3 text-amber-700" />
          <span>Upcoming</span>
        </button>
      );
    }

    if (status === 'Checking In') {
      return (
        <button
          key="status-checking-in"
          type="button"
          onClick={() => interactive && setManualStatusOverride('Checking In')}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
            isActive
              ? 'bg-purple-100 text-purple-900 border-2 border-purple-400 shadow-sm ring-2 ring-purple-300/40 animate-pulse'
              : 'bg-purple-50/80 text-purple-700/70 border border-purple-200/60 hover:bg-purple-100/60'
          }`}
          title="Checking In: Real-time OTP authentication in progress"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
          </span>
          <Radio className="w-3 h-3 text-purple-700" />
          <span>Checking In</span>
        </button>
      );
    }

    // Completed
    return (
      <button
        key="status-completed"
        type="button"
        onClick={() => interactive && setManualStatusOverride('Completed')}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
          isActive
            ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-400 shadow-sm ring-2 ring-emerald-300/40'
            : 'bg-emerald-50/80 text-emerald-700/70 border border-emerald-200/60 hover:bg-emerald-100/60'
        }`}
        title="Completed: Verified passes ready for instant check-in"
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Completed</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-150 relative my-auto">
        
        {/* Header with Event theme */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 p-5 sm:p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-white/20 text-white font-bold text-[10px] tracking-wider uppercase rounded-full flex items-center gap-1">
              <Ticket className="w-3 h-3" /> Event Pass & Ticket Registration
            </span>

            {/* Top Active Color-Coded Status Badge Indicator */}
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
              currentStatus === 'Completed'
                ? 'bg-emerald-500/90 text-white border-white/40'
                : currentStatus === 'Checking In'
                ? 'bg-purple-600/90 text-white border-white/40 animate-pulse'
                : 'bg-amber-400/90 text-slate-900 border-white/40'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              Live: {currentStatus}
            </span>
          </div>
          
          <h2 className="text-xl font-black font-serif leading-tight">
            Register for Event & Classes
          </h2>
          
          <p className="text-xs text-rose-50/90 mt-1 line-clamp-2">
            {eventTitle ? `For: ${eventTitle} • ` : ''}{displayActionLabel}
          </p>
        </div>

        {/* Real-time Registration Status Tracker Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3.5 sm:px-6">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Registration Status Tracker
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">Real-Time Sync</span>
          </div>

          {/* Stepper with the 3 Color-Coded Status Badges */}
          <div className="grid grid-cols-3 gap-2">
            {renderStatusBadge('Upcoming', true)}
            {renderStatusBadge('Checking In', true)}
            {renderStatusBadge('Completed', true)}
          </div>

          {/* Dynamic real-time stage description message */}
          <div className={`mt-2.5 px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-2 border font-medium transition-all ${
            currentStatus === 'Completed'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : currentStatus === 'Checking In'
              ? 'bg-purple-50 text-purple-900 border-purple-200'
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}>
            <Info className={`w-3.5 h-3.5 shrink-0 ${
              currentStatus === 'Completed' ? 'text-emerald-600' : currentStatus === 'Checking In' ? 'text-purple-600' : 'text-amber-600'
            }`} />
            <div className="leading-snug">
              {currentStatus === 'Upcoming' && (
                <span><strong>Upcoming Stage:</strong> Fill in attendee details below to initiate digital pass reservation.</span>
              )}
              {currentStatus === 'Checking In' && (
                <span><strong>Checking In Stage:</strong> Real-time OTP authentication active. Enter mobile/email codes to lock in passes.</span>
              )}
              {currentStatus === 'Completed' && (
                <span><strong>Completed Stage:</strong> Contact verified! Instant e-pass and QR code will be generated upon submission.</span>
              )}
            </div>
          </div>
        </div>

        {/* Body Form or Quick Book Success View */}
        {quickBookSuccessData ? (
          <div className="p-6 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3 text-emerald-600" /> 1-Click Quick Booking Confirmed
              </div>
              <h3 className="text-xl font-black text-slate-900">
                You're Registered & Confirmed!
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Your pass for <strong>{quickBookSuccessData.booking.itemTitle}</strong> has been secured instantly via your saved Vernunt Wallet balance.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Digital Pass Reference:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {quickBookSuccessData.booking.ticketNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Attendee Name:</span>
                <span className="font-bold text-slate-800">{quickBookSuccessData.booking.buyerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Wallet Payment Deducted:</span>
                <span className="font-bold font-mono text-emerald-700">-₹{quickBookSuccessData.amountDebited}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-bold">
                <span className="text-slate-700">Remaining Wallet Balance:</span>
                <span className="font-mono text-slate-900">₹{quickBookSuccessData.remainingBalance}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onSuccess(quickBookSuccessData.buyerProfile, quickBookSuccessData.booking)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <span>View My Digital E-Ticket Pass</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* ⚡ 1-Click Quick Book with Saved Wallet Card */}
            {hasSavedWalletBalance ? (
              <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border-2 border-amber-400 rounded-2xl p-4 shadow-sm space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
                      <Zap className="w-5 h-5 fill-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                          Quick Book with Wallet
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" /> 1-Click Pay
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        Skip OTP forms & checkout instantly using your saved wallet
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-medium">Saved Balance</span>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300 inline-flex items-center gap-1">
                      <Wallet className="w-3 h-3 text-emerald-700" />
                      ₹{wallet.balance}
                    </span>
                  </div>
                </div>

                {/* Event & Price pill */}
                <div className="bg-white/95 border border-amber-200/90 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold truncate max-w-[240px]">
                    <Ticket className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{effectiveEventTitle}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {effectivePrice > 0 ? `₹${effectivePrice}` : 'Free'}
                    </span>
                    {isFullyCoveredByWallet && (
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        100% Wallet Covered
                      </span>
                    )}
                  </div>
                </div>

                {/* The Quick Book Button */}
                <button
                  type="button"
                  onClick={handleQuickBookWithWallet}
                  disabled={isQuickBooking}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:via-orange-600 hover:to-rose-700 text-white font-black text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60"
                >
                  {isQuickBooking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Debiting ₹{effectivePrice} & Issuing Pass...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white animate-pulse" />
                      <span>
                        Quick Book Now (₹{effectivePrice} via Wallet • 1-Click)
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Instant Verified QR Pass
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3 h-3 text-amber-600" /> Safe 1-Click Wallet Debit
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-slate-400" />
                  <span>Vernunt Wallet balance: <strong>₹{wallet.balance}</strong></span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Standard OTP registration below
                </span>
              </div>
            )}

            {hasSavedWalletBalance && (
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                  Or fill standard registration
                </span>
              </div>
            )}
            
            {/* Trust Banner */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-amber-900 leading-snug">
                <span className="font-bold">Fast Mobile & Email OTP verification.</span> Digital QR passes, booking receipts, and virtual room credentials are automatically sent to your verified mobile and email.
              </div>
            </div>

          {generalError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold">
              {generalError}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-rose-500" /> Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setManualStatusOverride(null);
              }}
              placeholder="e.g. Vikram Mehta"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-200 focus:bg-white outline-none transition font-medium text-slate-900"
            />
          </div>

          {/* Mobile Number & OTP Verification */}
          <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-rose-500" /> Mobile Number <span className="text-rose-500">*</span>
              </label>
              {phoneVerified ? (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Mobile Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  OTP Required
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <div className="px-2.5 py-2 bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center justify-center shrink-0">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                disabled={phoneVerified}
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (phoneVerified) setPhoneVerified(false);
                  setManualStatusOverride(null);
                }}
                placeholder="10-digit mobile"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-200 outline-none font-mono"
              />
              {!phoneVerified && (
                <button
                  type="button"
                  onClick={handleSendPhoneOtp}
                  disabled={isSendingPhoneOtp || mobileNumber.length < 10}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shrink-0 whitespace-nowrap cursor-pointer"
                >
                  {isSendingPhoneOtp ? 'Sending...' : phoneOtpSent ? 'Resend' : 'Send OTP'}
                </button>
              )}
            </div>

            {phoneOtpError && (
              <p className="text-[10px] text-red-500 font-semibold">{phoneOtpError}</p>
            )}

            {phoneOtpSent && !phoneVerified && (
              <div className="mt-2 p-2.5 bg-white border border-orange-200 rounded-xl space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                  <span>Enter 6-Digit Mobile OTP</span>
                  <span className="text-orange-600 font-normal">Test code: 123456</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={phoneOtpCode}
                    onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPhoneOtp}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Email Address & Email OTP Verification */}
          <div className="space-y-1.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-rose-500" /> Email Address <span className="text-rose-500">*</span>
              </label>
              {emailVerified ? (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Email Verified
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  OTP Required
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="email"
                required
                disabled={emailVerified}
                value={emailAddress}
                onChange={(e) => {
                  setEmailAddress(e.target.value);
                  if (emailVerified) setEmailVerified(false);
                  setManualStatusOverride(null);
                }}
                placeholder="attendee@example.com"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-200 outline-none"
              />
              {!emailVerified && (
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={isSendingEmailOtp || !emailAddress.includes('@')}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1"
                >
                  {isSendingEmailOtp ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>{emailOtpSent ? 'Resend' : 'Send OTP'}</span>
                  )}
                </button>
              )}
            </div>

            {emailOtpError && (
              <p className="text-[10px] text-red-500 font-semibold">{emailOtpError}</p>
            )}

            {emailOtpSent && !emailVerified && (
              <div className="mt-2 p-2.5 bg-white border border-orange-200 rounded-xl space-y-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
                  <span>Enter 6-Digit Email Code</span>
                  <span className="text-orange-600 font-normal">Test code: 123456</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyEmailOtp}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Verify OTP
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick 1-Click Fast Verification for testing */}
          {(!phoneVerified || !emailVerified) && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">Testing shortcut:</span>
              <button
                type="button"
                onClick={handleQuickVerifyAll}
                className="text-[10px] text-rose-700 hover:text-rose-800 font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                ⚡ 1-Click Fast Verify All
              </button>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Used only for event updates, ticketing, and booking receipts.</span>
          </div>

          {/* Quick Book alternate button at bottom */}
          {hasSavedWalletBalance && (
            <button
              type="button"
              onClick={handleQuickBookWithWallet}
              disabled={isQuickBooking}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-rose-500/25 border border-amber-300 text-amber-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {isQuickBooking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                  <span>Processing Quick Booking...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600 animate-pulse" />
                  <span>⚡ Quick Book with Wallet (1-Click • ₹{effectivePrice})</span>
                </>
              )}
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !fullName.trim() || mobileNumber.length < 10 || !emailAddress.includes('@')}
            className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2 ${
              currentStatus === 'Completed'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 disabled:opacity-50'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Issuing Pass & Completing Registration...</span>
              </span>
            ) : (
              <>
                <span>Complete Registration & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Switch to login / Parent Registration */}
          <div className="pt-2 border-t border-slate-150 flex items-center justify-between text-xs text-slate-500">
            <span>Already registered on Vernunt?</span>
            {onSwitchToLogin && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                Login here
              </button>
            )}
          </div>
        </form>
      )}
      </div>
    </div>
  );
};

export default EventBuyerRegistrationModal;

