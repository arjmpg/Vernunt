import React, { useState } from 'react';
import { DaycarePlayhomeProfile, ChildProfile, CareBookingRequest } from '../types.ts';
import { 
  X, Calendar, Clock, MapPin, ShieldCheck, Shield, Heart, 
  Baby, DollarSign, AlertCircle, CheckCircle2, Phone, Sparkles, Lock,
  Camera, Utensils, Award, Home, Navigation, Briefcase
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendCareReservationNotifications } from '../utils/notifications.ts';

interface CareBookingModalProps {
  provider: DaycarePlayhomeProfile;
  currentUserProfile: ChildProfile | null;
  onClose: () => void;
  onSubmitBooking: (booking: CareBookingRequest) => void;
  initialDate?: string;
  initialStartTime?: string;
  initialDurationHours?: number;
}

export default function CareBookingModal({
  provider,
  currentUserProfile,
  onClose,
  onSubmitBooking,
  initialDate,
  initialStartTime,
  initialDurationHours = 2
}: CareBookingModalProps) {
  // Service mode options supported by provider
  const availableModes = provider.careServiceModes || ['host_at_my_home'];
  const [serviceMode, setServiceMode] = useState<'host_at_my_home' | 'visit_parents_home'>(
    availableModes.includes('host_at_my_home') ? 'host_at_my_home' : 'visit_parents_home'
  );

  const [serviceLocationAddress, setServiceLocationAddress] = useState<string>(
    (currentUserProfile as any)?.currentAddress || currentUserProfile?.location.address || ''
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>(initialStartTime || '10:00 AM');
  const [durationHours, setDurationHours] = useState<number>(initialDurationHours);
  
  const [childName, setChildName] = useState<string>(currentUserProfile?.childName || 'Ayaan');
  const [childAge, setChildAge] = useState<number>(currentUserProfile?.childAge || 5);
  const [childGender, setChildGender] = useState<string>(currentUserProfile?.childGender || 'Boy');
  const [parentName, setParentName] = useState<string>(currentUserProfile?.parentName || 'Parent');
  const [parentPhone, setParentPhone] = useState<string>(currentUserProfile?.phoneNumber || '9820011223');
  const [emergencyContact, setEmergencyContact] = useState<string>(currentUserProfile?.phoneNumber || '9820011223');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<CareBookingRequest | null>(null);

  // Time Slot options
  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  const durationOptions = [
    { label: '1 Hour', hours: 1, tag: 'Quick Errand' },
    { label: '2 Hours', hours: 2, tag: 'Popular' },
    { label: '3 Hours', hours: 3, tag: 'Half-Day Trip' },
    { label: '4 Hours', hours: 4, tag: 'Work Meeting' },
    { label: '6 Hours', hours: 6, tag: 'Extended' },
    { label: 'Full Day (8h)', hours: 8, tag: 'Full Day Pass' }
  ];

  // Active hourly rate based on selected mode
  const effectiveHourlyRate = serviceMode === 'visit_parents_home'
    ? (provider.hourlyRateParentHome !== undefined ? provider.hourlyRateParentHome : provider.hourlyRate)
    : (provider.hourlyRateNeighborHome !== undefined ? provider.hourlyRateNeighborHome : provider.hourlyRate);

  // Calculate Total Fee
  const calculateTotal = () => {
    if (effectiveHourlyRate === 0) return 0;
    if (serviceMode === 'host_at_my_home') {
      if (durationHours >= 8 && provider.fullDayRate) {
        return provider.fullDayRate;
      }
      if (durationHours >= 4 && provider.halfDayRate) {
        const baseHalf = provider.halfDayRate;
        const extraHours = durationHours - 4;
        return baseHalf + extraHours * effectiveHourlyRate;
      }
    }
    return effectiveHourlyRate * durationHours;
  };

  const totalFee = calculateTotal();

  // Helper to calculate end time string
  const getEndTimeStr = (start: string, duration: number) => {
    try {
      const [timePart, meridiem] = start.split(' ');
      const [hStr, mStr] = timePart.split(':');
      let hours = parseInt(hStr, 10);
      const minutes = parseInt(mStr, 10);
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      
      const totalStartMin = hours * 60 + minutes;
      const totalEndMin = (totalStartMin + duration * 60) % (24 * 60);
      
      let endHours = Math.floor(totalEndMin / 60);
      const endMinutes = totalEndMin % 60;
      const endMeridiem = endHours >= 12 ? 'PM' : 'AM';
      if (endHours > 12) endHours -= 12;
      if (endHours === 0) endHours = 12;
      
      return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')} ${endMeridiem}`;
    } catch {
      return 'After Session';
    }
  };

  const endTimeStr = getEndTimeStr(startTime, durationHours);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim() || !parentPhone.trim()) {
      alert('Please fill out your child details and contact number.');
      return;
    }
    if (serviceMode === 'visit_parents_home' && !serviceLocationAddress.trim()) {
      alert('Please provide your home address where the caregiver will visit.');
      return;
    }

    setIsSubmitting(true);

    // Generate random 4-digit dropoff and pickup security PINs
    const dropPin = String(Math.floor(1000 + Math.random() * 9000));
    const pickPin = String(Math.floor(1000 + Math.random() * 9000));

    const newBooking: CareBookingRequest = {
      id: `care-req-${Date.now()}`,
      parentId: currentUserProfile?.id || 'user-0',
      parentName: parentName || 'Parent',
      parentPhone,
      parentPhotoUrl: currentUserProfile?.parentPhotoUrl || currentUserProfile?.photoUrl,
      childName,
      childAge,
      childGender,
      providerId: provider.id,
      providerName: provider.hostName,
      providerTitle: provider.title,
      providerType: provider.providerType,
      providerHourlyRate: effectiveHourlyRate,
      serviceMode,
      serviceLocationAddress: serviceMode === 'visit_parents_home' ? serviceLocationAddress : undefined,
      date: selectedDate,
      startTime,
      endTime: endTimeStr,
      durationHours,
      totalAmount: totalFee,
      status: 'Pending',
      dropOffPin: dropPin,
      pickupPin: pickPin,
      specialInstructions,
      emergencyContact: emergencyContact || parentPhone,
      createdAt: new Date().toISOString(),
      senderRole: 'parent',
      careActivityLog: [
        {
          timestamp: 'Just Now',
          activity: 'Request Created',
          note: `Care request sent for ${durationHours} hr (${startTime} to ${endTimeStr}) via ${serviceMode === 'visit_parents_home' ? 'Visiting Parent Home' : 'Drop-off at Provider Space'}`
        }
      ]
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
      setCreatedBooking(newBooking);
      onSubmitBooking(newBooking);
      
      // Dispatch Instant Email/SMS confirmation
      sendCareReservationNotifications({
        toEmail: currentUserProfile?.email,
        toPhone: parentPhone,
        parentName: parentName || 'Parent',
        childName,
        providerName: provider.hostName,
        providerTitle: provider.title,
        date: selectedDate,
        startTime,
        endTime: endTimeStr,
        dropOffPin: dropPin,
        pickupPin: pickPin,
        totalFee: totalFee
      }).catch((e) => console.warn('Care notification note:', e));

      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 p-5 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
              🍼 Daycare &amp; Babysitting Booking
            </span>
            <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
              {effectiveHourlyRate === 0 ? '🎁 100% Free Co-Op' : `₹${effectiveHourlyRate}/hr`}
            </span>
          </div>

          <h3 className="font-serif font-black text-xl text-white leading-tight">
            Book Child Care &amp; Sitting
          </h3>
          <p className="text-xs text-orange-100 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{provider.title} • {provider.hostName}</span>
            {provider.location.distance !== undefined && (
              <span className="font-bold bg-white/25 px-1.5 py-0.2 rounded-md ml-1">
                {provider.location.distance} km away
              </span>
            )}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {bookingSuccess && createdBooking ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-serif font-black text-xl text-slate-900">
                  Sitting Request Sent Successfully!
                </h4>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  We have notified <strong>{provider.hostName}</strong> of your care request for <strong>{createdBooking.childName}</strong> on {createdBooking.date} from {createdBooking.startTime} to {createdBooking.endTime} ({createdBooking.serviceMode === 'visit_parents_home' ? "Visiting Parent's Home" : "Drop-off at Provider's Space"}).
                </p>
              </div>

              {/* Handshake Security Pass Box */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-left max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-700" /> Secure Care Handshake
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                    Aadhaar Protected
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Start / Drop-Off PIN</span>
                    <span className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                      {createdBooking.dropOffPin}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Share upon session start</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">End / Pickup PIN</span>
                    <span className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                      {createdBooking.pickupPin}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Share upon pickup/session end</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-900 leading-snug">
                  🛡️ <strong>Safety Guarantee:</strong> Provide the 4-digit PIN to {provider.hostName} to verify identity. You can track live sitting status in the <strong>Daycare &amp; Sitting</strong> tab.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Done &amp; View Care Tracker
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Provider Quick Snapshot */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3.5">
                <img
                  src={provider.avatarUrl}
                  alt={provider.hostName}
                  className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {provider.title}
                    </h4>
                    {provider.aadhaarVerified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                    Host: {provider.hostName} • {provider.experienceYears}y experience • {provider.providerType}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-600 font-semibold">
                    <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded font-black">
                      ★ {provider.rating.toFixed(1)} ({provider.reviewsCount} reviews)
                    </span>
                    {provider.hourlyRateNeighborHome !== undefined && (
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        🏡 Drop-off: ₹{provider.hourlyRateNeighborHome}/hr
                      </span>
                    )}
                    {provider.hourlyRateParentHome !== undefined && (
                      <span className="text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                        🚶‍♀️ Home Visit: ₹{provider.hourlyRateParentHome}/hr
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 0. SERVICE MODE SELECTION (CRITICAL FOR VISITING VS HOSTING) */}
              {availableModes.length > 1 && (
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    <span>Choose Where You Want Childcare Service</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceMode('host_at_my_home')}
                      className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                        serviceMode === 'host_at_my_home'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span>🏡 Drop-off at Provider's Home</span>
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-700">
                          ₹{provider.hourlyRateNeighborHome ?? provider.hourlyRate}/hr
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 mt-1">
                        Bring your child to {provider.hostName}'s prepared daycare/play space.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setServiceMode('visit_parents_home')}
                      className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                        serviceMode === 'visit_parents_home'
                          ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span>🚶‍♀️ Provider Visits My House</span>
                        </span>
                        <span className="text-xs font-mono font-black text-indigo-700">
                          ₹{provider.hourlyRateParentHome ?? provider.hourlyRate}/hr
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 mt-1">
                        Caregiver comes directly to your home to watch over babies/kids.
                      </p>
                    </button>
                  </div>

                  {serviceMode === 'visit_parents_home' && (
                    <div className="pt-2 animate-fade-in">
                      <label className="block text-[11px] font-extrabold text-slate-800 mb-1">
                        Your House Address (Where Caregiver Will Visit) *
                      </label>
                      <input
                        type="text"
                        value={serviceLocationAddress}
                        onChange={(e) => setServiceLocationAddress(e.target.value)}
                        placeholder="e.g. Flat 402, Sunshine Heights, 14th Road, Bandra West"
                        className="w-full px-3 py-2 bg-white border-2 border-indigo-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-indigo-600"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 1. Date & Time Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-rose-600" />
                  <span>1. Select Date &amp; Start Time</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Start Time</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600 cursor-pointer"
                    >
                      {timeSlots.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Duration Selector */}
              <div className="space-y-2.5">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>2. How Long Will You Need Care? (Duration)</span>
                  </span>
                  <span className="text-[11px] font-extrabold text-orange-700">
                    Session Ends: {endTimeStr}
                  </span>
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {durationOptions.map((opt) => {
                    const isSelected = durationHours === opt.hours;
                    return (
                      <button
                        key={opt.hours}
                        type="button"
                        onClick={() => setDurationHours(opt.hours)}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-between gap-1 ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-black'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-rose-300 font-bold'
                        }`}
                      >
                        <span className="text-xs">{opt.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {opt.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Child & Contact Information */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Baby className="w-4 h-4 text-amber-600" />
                  <span>3. Child Details &amp; Special Instructions</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Child Name</label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      placeholder="Child's Name"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={childAge}
                      min={0}
                      max={15}
                      onChange={(e) => setChildAge(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Gender</label>
                    <select
                      value={childGender}
                      onChange={(e) => setChildGender(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600 cursor-pointer"
                    >
                      <option value="Boy">Boy</option>
                      <option value="Girl">Girl</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Parent Phone (Verified)</label>
                    <input
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="10-digit phone"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Alternate Phone</label>
                    <input
                      type="tel"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="Alternate relative/doctor phone"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Special Care Instructions / Allergies / Nap Routine (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Loves storybooks, nap time around 2:00 PM, allergic to peanuts, formula bottle packed in bag..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-rose-600"
                  />
                </div>
              </div>

              {/* 4. Pricing & Fee Summary */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="font-medium">
                    Rate: {effectiveHourlyRate === 0 ? 'Free Community Sharing' : `₹${effectiveHourlyRate}/hour × ${durationHours} hours (${serviceMode === 'visit_parents_home' ? "Visiting Rate" : "Host Home Rate"})`}
                  </span>
                  <span className="font-bold text-slate-900">
                    {effectiveHourlyRate === 0 ? '₹0' : `₹${effectiveHourlyRate * durationHours}`}
                  </span>
                </div>

                {serviceMode === 'host_at_my_home' && durationHours >= 8 && provider.fullDayRate && (
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                    <span>Full-Day Pass Discount applied</span>
                    <span>-₹{(effectiveHourlyRate * durationHours) - provider.fullDayRate}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                      Total Care Fee
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Paid directly upon safe drop-off or pickup
                    </span>
                  </div>
                  <span className="font-mono font-black text-2xl text-rose-700">
                    {totalFee === 0 ? '₹0 FREE' : `₹${totalFee}`}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 rounded-2xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Sending Care Handshake Request...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Confirm &amp; Request Care (₹{totalFee})</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
