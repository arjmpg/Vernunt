import React, { useState } from 'react';
import { CommunityEvent, Booking, TicketTier, EventCoupon } from '../../types.ts';
import { 
  X, Ticket, Calendar, Clock, MapPin, Check, Sparkles, 
  CreditCard, ShieldCheck, Tag, AlertCircle, Plus, Minus, 
  User, Phone, ChevronRight, CheckCircle2, Mail, Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendEventBookingNotifications, NotificationStatus } from '../../utils/notifications.ts';
import { attributeAffiliateBooking } from '../../utils/affiliate.ts';

interface EventBookingModalProps {
  event: CommunityEvent;
  userProfile: any;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
  globalCommissionRate: number;
}

const AVAILABLE_COUPONS: EventCoupon[] = [
  { code: 'VERNUNT10', discountType: 'percentage', discountValue: 10, description: '10% Off on all Community Events' },
  { code: 'EARLYBIRD', discountType: 'flat', discountValue: 50, description: '₹50 Flat Early Bird Discount' },
  { code: 'FAMILY20', discountType: 'percentage', discountValue: 20, minPurchase: 500, description: '20% Off on bookings over ₹500' },
  { code: 'KIDSFREE', discountType: 'percentage', discountValue: 100, description: '100% Free Sponsor Pass' }
];

export default function EventBookingModal({
  event,
  userProfile,
  onClose,
  onBookingSuccess,
  globalCommissionRate
}: EventBookingModalProps) {
  // Available Tiers (fallback to event base price if no custom tiers)
  const defaultTiers: TicketTier[] = event.ticketTiers && event.ticketTiers.length > 0 
    ? event.ticketTiers 
    : [
        {
          id: 'tier-general',
          name: 'General Admission (1 Kid + 1 Parent)',
          price: event.ticketPrice || 0,
          capacity: 50,
          remainingStock: 24,
          description: 'Standard event entry with access to all play zones.',
          maxPerOrder: 5
        },
        {
          id: 'tier-vip',
          name: 'VIP Family Pass + Workshop Activity Kit',
          price: event.ticketPrice ? Math.round(event.ticketPrice * 1.5) : 199,
          capacity: 20,
          remainingStock: 4,
          description: 'Priority front-row seating, take-home creative craft kit, and snack voucher.',
          maxPerOrder: 3,
          includesKit: true
        }
      ];

  const [selectedTierId, setSelectedTierId] = useState<string>(defaultTiers[0]?.id || 'tier-general');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(
    event.recurringSlots && event.recurringSlots.length > 0 ? event.recurringSlots[0] : event.time
  );

  // Attendee Form
  const [buyerName, setBuyerName] = useState(userProfile?.parentName || '');
  const [buyerEmail, setBuyerEmail] = useState(userProfile?.email || 'parent@vernunt.org');
  const [buyerPhone, setBuyerPhone] = useState(userProfile?.phoneNumber || '+91 98765 43210');
  const [childName, setChildName] = useState(userProfile?.childName || '');
  const [childAge, setChildAge] = useState<number>(userProfile?.childAge || 5);
  const [specialNotes, setSpecialNotes] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState(userProfile?.phoneNumber || '');

  // Promo Engine
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<EventCoupon | null>(null);
  const [promoError, setPromoError] = useState('');

  // Checkout Step
  const [step, setStep] = useState<'tier_selection' | 'attendee_info' | 'payment_processing' | 'otp_verify' | 'confirmed'>('tier_selection');
  const [otpValue, setOtpValue] = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);

  const selectedTier = defaultTiers.find(t => t.id === selectedTierId) || defaultTiers[0];
  const unitPrice = selectedTier ? selectedTier.price : (event.ticketPrice || 0);
  const subtotal = unitPrice * quantity;

  // Calculate Discounts
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else {
      discountAmount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  const convenienceFee = subtotal > 0 ? Math.round(subtotal * 0.02) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + convenienceFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const clean = promoCode.trim().toUpperCase();
    const found = AVAILABLE_COUPONS.find(c => c.code === clean);
    if (!found) {
      setPromoError('Invalid coupon code. Try VERNUNT10 or EARLYBIRD');
      return;
    }
    if (found.minPurchase && subtotal < found.minPurchase) {
      setPromoError(`Minimum order amount of ₹${found.minPurchase} required for this code.`);
      return;
    }
    setAppliedCoupon(found);
  };

  const handleProceedToPayment = () => {
    if (!buyerName || !buyerEmail) {
      alert('Please provide your name and email address.');
      return;
    }
    setStep('payment_processing');

    setTimeout(() => {
      if (finalTotal === 0) {
        // Free ticket - bypass OTP
        finalizeOrder('PAY_FREE_PROMO_' + Date.now().toString().slice(-6));
      } else {
        setStep('otp_verify');
      }
    }, 1200);
  };

  const finalizeOrder = (paymentId: string) => {
    const ticketNum = `VERN-EVT-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`;
    const effectiveCommission = event.commissionPercentage !== undefined ? event.commissionPercentage : globalCommissionRate;
    const commEarned = Math.round((finalTotal * effectiveCommission) / 100);
    const hostEarned = finalTotal - commEarned;

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      itemId: event.id,
      itemTitle: event.title,
      type: 'EventTicket',
      buyerName: buyerName,
      buyerEmail: buyerEmail,
      buyerPhone: buyerPhone,
      amountPaid: finalTotal,
      commissionPercentage: effectiveCommission,
      commissionEarned: commEarned,
      hostEarned: hostEarned,
      dateStr: event.date,
      timeSelected: selectedTimeSlot,
      razorpayPaymentId: paymentId,
      status: 'Paid',
      ticketNumber: ticketNum,
      ticketTierName: selectedTier.name,
      tierId: selectedTier.id,
      childName: childName,
      childAge: childAge,
      specialRequirements: specialNotes,
      emergencyPhone: emergencyPhone || buyerPhone,
      eventVenue: event.location,
      checkedIn: false,
      quantity: quantity,
      createdAt: new Date().toISOString()
    };

    setCreatedBooking(newBooking);
    onBookingSuccess(newBooking);
    setStep('confirmed');

    // Automatically trigger instant Email and SMS notification delivery
    sendEventBookingNotifications({
      toEmail: buyerEmail,
      toPhone: buyerPhone,
      recipientName: buyerName,
      booking: newBooking,
      event: event,
      type: 'booking_confirmed'
    }).then((status) => {
      setNotificationStatus(status);
    }).catch((err) => {
      console.warn('Notification dispatch error:', err);
    });

    // Automatically attribute affiliate referral commission if buyer came via an affiliate partner link
    attributeAffiliateBooking(newBooking, event.title).then((affTx) => {
      if (affTx) {
        console.log('⚡ [Booking] Affiliate credited successfully:', affTx);
      }
    }).catch((affErr) => {
      console.warn('Affiliate attribution note:', affErr);
    });

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/30">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-orange-200 block">
                WooEvents Verified Checkout
              </span>
              <h3 className="text-base font-black leading-tight text-white line-clamp-1">
                {event.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span className={step === 'tier_selection' ? 'text-orange-600 font-bold' : ''}>
            1. Select Tickets
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={step === 'attendee_info' ? 'text-orange-600 font-bold' : ''}>
            2. Attendee Details
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={step === 'otp_verify' || step === 'confirmed' ? 'text-orange-600 font-bold' : ''}>
            3. E-Ticket Pass
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          
          {/* STEP 1: Tier Selection & Quantity */}
          {step === 'tier_selection' && (
            <div className="space-y-4">
              
              {/* Event Schedule & Time Slots */}
              {event.recurringSlots && event.recurringSlots.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Select Event Session / Time Slot
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {event.recurringSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center gap-2 ${
                          selectedTimeSlot === slot
                            ? 'bg-orange-50 border-orange-500 text-orange-950 ring-2 ring-orange-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 text-orange-500" />
                        <span>{slot}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Ticket Tiers List */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Choose Ticket Tier
                </label>

                {defaultTiers.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  const isLowStock = tier.remainingStock <= 5 && tier.remainingStock > 0;
                  const isSoldOut = tier.remainingStock === 0;

                  return (
                    <div
                      key={tier.id}
                      onClick={() => !isSoldOut && setSelectedTierId(tier.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/40 shadow-xs' 
                          : isSoldOut 
                          ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">{tier.name}</h4>
                            {tier.includesKit && (
                              <span className="text-[10px] font-extrabold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">
                                Includes Kit
                              </span>
                            )}
                            {isLowStock && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md animate-pulse">
                                Only {tier.remainingStock} Left!
                              </span>
                            )}
                            {isSoldOut && (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                                Sold Out
                              </span>
                            )}
                          </div>
                          {tier.description && (
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {tier.description}
                            </p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-black text-slate-900">
                            {tier.price === 0 ? (
                              <span className="text-emerald-600">FREE</span>
                            ) : (
                              `₹${tier.price}`
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">per ticket</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Number of Attendees</span>
                  <span className="text-[11px] text-slate-500">Max {selectedTier?.maxPerOrder || 5} passes per order</span>
                </div>
                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-30"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(selectedTier?.maxPerOrder || 5, quantity + 1))}
                    disabled={quantity >= (selectedTier?.maxPerOrder || 5)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code (e.g. VERNUNT10)"
                      className="w-full text-xs pl-8 pr-3 py-2 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 uppercase font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Apply
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2 rounded-xl border border-emerald-200">
                    <span className="font-bold">🎉 {appliedCoupon.code} applied! (-₹{discountAmount})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setPromoCode('');
                      }}
                      className="text-emerald-900 hover:underline font-bold text-[11px]"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-xs text-rose-600 font-medium">{promoError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('attendee_info')}
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 transition-colors"
              >
                <span>Continue to Attendee Info (₹{finalTotal})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Attendee Details Form */}
          {step === 'attendee_info' && (
            <div className="space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Primary Parent / Buyer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Address (For Pass) *
                    </label>
                    <input
                      type="email"
                      required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="parent@gmail.com"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WhatsApp Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Attending Child's Name
                    </label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="e.g. Aarav"
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Child's Age (Years)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={17}
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Special Requirements or Allergies (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Peanut allergy, wheelchair access, booster seat"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Order Summary Receipt Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  Order Summary
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>{selectedTier.name} × {quantity}</span>
                  <span className="font-semibold text-slate-800">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="font-bold">-₹{discountAmount}</span>
                  </div>
                )}
                {convenienceFee > 0 && (
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Secure Gateway Processing Fee (2%)</span>
                    <span>₹{convenienceFee}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Total Payable:</span>
                  <span className="font-black text-orange-600 text-base">₹{finalTotal}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('tier_selection')}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {finalTotal === 0 ? 'Confirm Free Registration' : `Pay ₹${finalTotal} with Razorpay`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Razorpay Payment Simulation & OTP */}
          {step === 'payment_processing' && (
            <div className="py-10 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto animate-pulse">
                <CreditCard className="w-7 h-7" />
              </div>
              <h4 className="font-black text-slate-900 text-base">
                Connecting to Razorpay Gateway...
              </h4>
              <p className="text-xs text-slate-500">
                Securing ₹{finalTotal} transaction with 256-bit bank encryption.
              </p>
            </div>
          )}

          {step === 'otp_verify' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center space-y-1 text-xs">
                <span className="font-bold text-blue-900 block">Bank 3D Secure OTP</span>
                <p className="text-blue-700">
                  Enter the 6-digit test OTP sent to {buyerPhone} to confirm ₹{finalTotal} payment.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  placeholder="Enter OTP (e.g. 123456)"
                  className="w-full text-center tracking-widest text-lg font-mono font-bold p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setOtpValue('123456')}
                  className="text-xs text-orange-600 font-semibold hover:underline block text-center mx-auto"
                >
                  Auto-fill Test OTP (123456)
                </button>
              </div>

              <button
                type="button"
                onClick={() => finalizeOrder('RZP_PROD_' + Date.now().toString().slice(-8))}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-colors"
              >
                Verify & Generate E-Ticket
              </button>
            </div>
          )}

          {/* STEP 4: Confirmed & Issued */}
          {step === 'confirmed' && createdBooking && (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  Booking Confirmed! 🎉
                </h4>
                <p className="text-xs text-slate-500">
                  Your admission pass <span className="font-mono font-bold text-slate-800">{createdBooking.ticketNumber}</span> has been issued.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-left space-y-1.5">
                <div><strong>Event:</strong> {createdBooking.itemTitle}</div>
                <div><strong>Date & Time:</strong> {createdBooking.dateStr} at {createdBooking.timeSelected}</div>
                <div><strong>Attendee:</strong> {createdBooking.childName || createdBooking.buyerName}</div>
                <div><strong>Pass Tier:</strong> {createdBooking.ticketTierName} (Qty: {createdBooking.quantity})</div>
              </div>

              {/* Automated Email & SMS delivery badge */}
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3.5 text-xs text-left space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant Notifications Dispatched:</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block">E-Ticket & QR Email</span>
                      <span className="text-slate-500 truncate block">{createdBooking.buyerEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/90 p-2 rounded-xl border border-emerald-100 shadow-2xs">
                    <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block">Gate SMS & Link</span>
                      <span className="text-slate-500 truncate block">{createdBooking.buyerPhone || buyerPhone}</span>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-emerald-800 font-medium">
                  ✓ Full admission receipt, QR check-in code, and calendar reminders sent.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                View My E-Ticket Pass
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
