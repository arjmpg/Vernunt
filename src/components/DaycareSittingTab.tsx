import React, { useState, useMemo } from 'react';
import { 
  DaycarePlayhomeProfile, 
  CareBookingRequest, 
  ChildProfile, 
  CareProviderType,
  CareBookingStatus
} from '../types.ts';
import { 
  MapPin, Clock, Calendar, ShieldCheck, Heart, Star, 
  Baby, DollarSign, Sparkles, Filter, Plus, Search, 
  CheckCircle2, ArrowRight, Eye, Phone, MessageSquare, 
  AlertCircle, ChevronRight, Lock, Award, Users, Home,
  Share2, Check, Radio, SlidersHorizontal, BellRing
} from 'lucide-react';
import CareBookingModal from './CareBookingModal.tsx';
import CareProviderRegistrationModal from './CareProviderRegistrationModal.tsx';
import CareHandshakeModal from './CareHandshakeModal.tsx';
import confetti from 'canvas-confetti';

interface DaycareSittingTabProps {
  daycarePlayhomes: DaycarePlayhomeProfile[];
  careBookings: CareBookingRequest[];
  currentUserProfile: ChildProfile | null;
  onSaveDaycareProfile: (profile: DaycarePlayhomeProfile) => void;
  onAddCareBooking: (booking: CareBookingRequest) => void;
  onUpdateBookingStatus: (bookingId: string, newStatus: CareBookingStatus, logNote?: string) => void;
  onOpenChatWithUser?: (opponentId: string) => void;
  onOpenUserProfile?: (user: ChildProfile) => void;
}

export default function DaycareSittingTab({
  daycarePlayhomes,
  careBookings,
  currentUserProfile,
  onSaveDaycareProfile,
  onAddCareBooking,
  onUpdateBookingStatus,
  onOpenChatWithUser,
  onOpenUserProfile
}: DaycareSittingTabProps) {
  // Navigation & Sub-views
  const [activeSubView, setActiveSubView] = useState<'find' | 'my-bookings' | 'host'>('find');
  
  // Search & Time Filter State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedStartTime, setSelectedStartTime] = useState<string>('10:00 AM');
  const [selectedDurationHours, setSelectedDurationHours] = useState<number>(2);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filters
  const [selectedProviderType, setSelectedProviderType] = useState<string>('All');
  const [selectedServiceMode, setSelectedServiceMode] = useState<'All' | 'host_at_my_home' | 'visit_parents_home'>('All');
  const [selectedEntityType, setSelectedEntityType] = useState<'All' | 'individual' | 'center'>('All');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(10);
  const [maxHourlyPrice, setMaxHourlyPrice] = useState<number>(500);
  const [onlyFreeCoop, setOnlyFreeCoop] = useState<boolean>(false);
  const [onlyAcceptingNow, setOnlyAcceptingNow] = useState<boolean>(false);
  
  // Modals
  const [bookingModalProvider, setBookingModalProvider] = useState<DaycarePlayhomeProfile | null>(null);
  const [isRegisteringProvider, setIsRegisteringProvider] = useState<boolean>(false);
  const [selectedBookingForHandshake, setSelectedBookingForHandshake] = useState<CareBookingRequest | null>(null);
  const [viewingProfileDetails, setViewingProfileDetails] = useState<DaycarePlayhomeProfile | null>(null);
  
  // Broadcast Notification Toast
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

  // Time Slots
  const TIME_SLOTS = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
    '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  const DURATION_PILLS = [
    { hours: 1, label: '1 Hour', sub: 'Quick errand' },
    { hours: 2, label: '2 Hours', sub: 'Most popular' },
    { hours: 3, label: '3 Hours', sub: 'Half day' },
    { hours: 4, label: '4 Hours', sub: 'Work trip' },
    { hours: 8, label: 'Full Day', sub: '8h Care' }
  ];

  // Check if current user is already a registered provider
  const currentUserProviderProfile = useMemo(() => {
    return daycarePlayhomes.find(p => p.userId === currentUserProfile?.id || p.hostName === currentUserProfile?.parentName);
  }, [daycarePlayhomes, currentUserProfile]);

  // Calculate distance-wise sorted and filtered profiles
  const sortedAndFilteredProfiles = useMemo(() => {
    return daycarePlayhomes
      .filter(profile => {
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = profile.title.toLowerCase().includes(q);
          const matchHost = profile.hostName.toLowerCase().includes(q);
          const matchAddress = profile.location.address.toLowerCase().includes(q);
          const matchBio = profile.bio.toLowerCase().includes(q);
          if (!matchTitle && !matchHost && !matchAddress && !matchBio) return false;
        }

        // Provider type filter
        if (selectedProviderType !== 'All' && profile.providerType !== selectedProviderType) {
          return false;
        }

        // Entity type filter (individual vs center)
        if (selectedEntityType !== 'All') {
          const isInd = profile.providerEntityType === 'individual' || profile.providerType === 'Neighbour Parent' || profile.providerType === 'Individual Babysitter';
          if (selectedEntityType === 'individual' && !isInd) return false;
          if (selectedEntityType === 'center' && isInd) return false;
        }

        // Service mode filter (host at home vs visit parent's house)
        if (selectedServiceMode !== 'All') {
          const modes = profile.careServiceModes || ['host_at_my_home'];
          if (!modes.includes(selectedServiceMode)) return false;
        }

        // Distance filter
        const dist = profile.location.distance !== undefined ? profile.location.distance : 1.5;
        if (dist > maxDistanceKm) return false;

        // Price filter (effective rate depending on service mode)
        const relevantRate = selectedServiceMode === 'visit_parents_home'
          ? (profile.hourlyRateParentHome !== undefined ? profile.hourlyRateParentHome : profile.hourlyRate)
          : (profile.hourlyRateNeighborHome !== undefined ? profile.hourlyRateNeighborHome : profile.hourlyRate);

        if (onlyFreeCoop && relevantRate > 0) return false;
        if (relevantRate > maxHourlyPrice) return false;

        // Live availability
        if (onlyAcceptingNow && !profile.isAcceptingNow) return false;

        return true;
      })
      .sort((a, b) => {
        // Distance Wise: Nearest First (0.3km before 0.6km before 1.2km)
        const distA = a.location.distance !== undefined ? a.location.distance : 99;
        const distB = b.location.distance !== undefined ? b.location.distance : 99;
        return distA - distB;
      });
  }, [
    daycarePlayhomes, 
    searchQuery, 
    selectedProviderType,
    selectedServiceMode,
    selectedEntityType,
    maxDistanceKm, 
    maxHourlyPrice, 
    onlyFreeCoop, 
    onlyAcceptingNow
  ]);

  // Handle Broadcast Request to all nearby neighbours
  const handleBroadcastCareRequest = () => {
    setBroadcastSent(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
    setTimeout(() => {
      setBroadcastSent(false);
    }, 6000);
  };

  // Counts
  const activeBookingsCount = careBookings.filter(b => b.status !== 'Cancelled').length;
  const inProgressCount = careBookings.filter(b => b.status === 'Dropped Off' || b.status === 'In Care' || b.status === 'Ready for Pickup').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. TOP HERO HIGHLIGHT BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-amber-200 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Babysitting & Drop-in Daycare Marketplace</span>
          </div>

          <h1 className="font-serif font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
            Busy & Need Someone to Look After Your Child?
          </h1>

          <p className="text-xs sm:text-sm text-orange-100 leading-relaxed font-medium">
            Whether you need care for <strong>1 hour</strong> or a <strong>full day</strong>, auto-match with verified neighbour parents and certified Montessori playhomes nearest to you. Browse by distance, compare custom hourly rates, and safely drop off with our 4-digit PIN handshake.
          </p>

          {/* Quick Sub-Navigation Pills */}
          <div className="pt-3 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveSubView('find')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'find'
                  ? 'bg-white text-slate-900 shadow-md ring-2 ring-white/50'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find Sitter / Playhome (Nearest First)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('my-bookings')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubView === 'my-bookings'
                  ? 'bg-white text-slate-900 shadow-md ring-2 ring-white/50'
                  : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Active Care Sessions</span>
              {activeBookingsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1">
                  {activeBookingsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentUserProviderProfile) {
                  setIsRegisteringProvider(true);
                } else {
                  setIsRegisteringProvider(true);
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition cursor-pointer flex items-center gap-1.5 ml-auto"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{currentUserProviderProfile ? 'Edit My Sitter Profile & Hourly Rate' : '+ Offer Child Sitting / Post Available Hours'}</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* BROADCAST ALERT TOAST */}
      {broadcastSent && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg border border-emerald-400 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <BellRing className="w-6 h-6 text-amber-200 animate-bounce" />
            <div>
              <h4 className="font-extrabold text-sm">Care Broadcast Dispatched!</h4>
              <p className="text-xs text-emerald-100">
                Notified <strong>{daycarePlayhomes.length} verified neighbours & playhomes</strong> within 3km for {selectedDate} ({selectedStartTime}, {selectedDurationHours} hrs). You will receive instant notifications when they accept.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBroadcastSent(false)}
            className="text-white hover:text-emerald-200 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. SUB-VIEW: ACTIVE BOOKINGS & LIVE TRACKER */}
      {activeSubView === 'my-bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif font-black text-xl text-slate-900">
                Care Sessions & Handshake Tracker
              </h2>
              <p className="text-xs text-slate-600">
                Track drop-off verification PINs, live caregiver activity feeds, and pickup handshakes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubView('find')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" /> Book Another Sitter
            </button>
          </div>

          {careBookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                🍼
              </div>
              <h3 className="font-serif font-black text-lg text-slate-900">No Care Bookings Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need to go out? Select your desired time slot and auto-match with nearby playhomes and babysitters.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubView('find')}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Find Nearest Sitters Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careBookings.map((booking) => {
                const isLive = booking.status === 'Dropped Off' || booking.status === 'In Care' || booking.status === 'Ready for Pickup';
                const isAccepted = booking.status === 'Accepted';
                
                return (
                  <div
                    key={booking.id}
                    className={`bg-white rounded-3xl border p-5 shadow-xs transition space-y-4 ${
                      isLive 
                        ? 'border-emerald-400 ring-2 ring-emerald-100' 
                        : isAccepted 
                        ? 'border-blue-300' 
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Top Status & Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isLive
                            ? 'bg-emerald-500 text-white animate-pulse'
                            : isAccepted
                            ? 'bg-blue-600 text-white'
                            : booking.status === 'Completed'
                            ? 'bg-slate-800 text-white'
                            : 'bg-amber-400 text-slate-950'
                        }`}>
                          {isLive ? '🟢 Live In Care' : booking.status}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {booking.serviceMode === 'visit_parents_home' ? '🚶‍♀️ Visiting Parent Home' : '🏡 Drop-off at Sitter'}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-slate-500">
                        {booking.date} • {booking.startTime} - {booking.endTime}
                      </span>
                    </div>

                    {/* Care Details */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">
                          {booking.childName} ({booking.childAge}y) with {booking.providerName}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {booking.providerTitle}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-base font-black text-rose-700 block">
                          {booking.totalAmount === 0 ? 'Free Co-Op' : `₹${booking.totalAmount}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {booking.durationHours} hrs total
                        </span>
                      </div>
                    </div>

                    {/* PIN Handshake Preview */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Drop-Off PIN</span>
                        <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                          {booking.dropOffPin}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Pickup PIN</span>
                        <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                          {booking.pickupPin}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedBookingForHandshake(booking)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-xl transition cursor-pointer"
                      >
                        Open Pass & Live Feed
                      </button>
                    </div>

                    {/* Recent Care Update */}
                    {booking.careActivityLog && booking.careActivityLog.length > 0 && (
                      <div className="text-[11px] text-slate-600 bg-amber-50/70 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                        <span className="text-amber-700 font-bold">Latest:</span>
                        <span>{booking.careActivityLog[booking.careActivityLog.length - 1].activity} ({booking.careActivityLog[booking.careActivityLog.length - 1].timestamp})</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. SUB-VIEW: FIND SITTER / PLAYHOME (AUTO-MATCHER) */}
      {activeSubView === 'find' && (
        <div className="space-y-6">
          
          {/* AUTO-MATCH TIME CONTROLLER CARD */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  ⚡ Instant Time Slot Auto-Matcher
                </span>
                <h2 className="font-serif font-black text-lg sm:text-xl text-slate-900 mt-1">
                  When do you need to drop off your child?
                </h2>
              </div>

              {/* Broadcast Button */}
              <button
                type="button"
                onClick={handleBroadcastCareRequest}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <BellRing className="w-4 h-4 text-amber-200" />
                <span>Notify All Nearby Sitters ({daycarePlayhomes.length})</span>
              </button>
            </div>

            {/* Time Slot Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-600" />
                  <span>Drop-Off Date</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600 focus:bg-white"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  <span>Start Time</span>
                </label>
                <select
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600 focus:bg-white cursor-pointer"
                >
                  {TIME_SLOTS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Duration Pills */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Baby className="w-3.5 h-3.5 text-amber-600" />
                    <span>Duration Needed</span>
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold">
                    {selectedDurationHours} {selectedDurationHours === 1 ? 'Hour' : 'Hours'}
                  </span>
                </label>
                <div className="flex gap-1.5">
                  {DURATION_PILLS.map(p => (
                    <button
                      key={p.hours}
                      type="button"
                      onClick={() => setSelectedDurationHours(p.hours)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                        selectedDurationHours === p.hours
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Filter Bar */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              
              {/* Filter Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>

                {/* Service Mode Filter */}
                <select
                  value={selectedServiceMode}
                  onChange={(e) => setSelectedServiceMode(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="All">All Service Locations</option>
                  <option value="host_at_my_home">🏡 Drop-off at Host's Space</option>
                  <option value="visit_parents_home">🚶‍♀️ Sitter Visits Parent's Home</option>
                </select>

                {/* Entity Type Filter */}
                <select
                  value={selectedEntityType}
                  onChange={(e) => setSelectedEntityType(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="All">All Caregiver Types</option>
                  <option value="individual">👤 Individual Neighbor / Sitter</option>
                  <option value="center">🏫 Daycare &amp; Creche Center</option>
                </select>

                {/* Provider Type */}
                <select
                  value={selectedProviderType}
                  onChange={(e) => setSelectedProviderType(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Certified Playhome">Certified Playhomes</option>
                  <option value="Neighbour Parent">Neighbour Parents</option>
                  <option value="Home Daycare">Home Daycares</option>
                  <option value="Individual Babysitter">Individual Babysitters</option>
                </select>

                {/* Distance Slider */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-300">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span className="text-[11px] font-bold text-slate-700">Within {maxDistanceKm} km</span>
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={maxDistanceKm}
                    onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                    className="w-16 accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Free Co-op Toggle */}
                <button
                  type="button"
                  onClick={() => setOnlyFreeCoop(!onlyFreeCoop)}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 ${
                    onlyFreeCoop
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  🎁 Free Co-Op Only
                </button>
              </div>

              {/* Match Counter Badge */}
              <div className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                Found <strong>{sortedAndFilteredProfiles.length}</strong> matching providers (Closest first)
              </div>
            </div>

          </div>

          {/* 4. PROFILES LISTING (DISTANCE-WISE, NEARBY FIRST) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-black text-lg text-slate-900 flex items-center gap-2">
                <span>📍 Nearby Daycares & Neighbour Sitters</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Distance Wise (Closest First)
                </span>
              </h3>
            </div>

            {!currentUserProfile ? (
              <div className="bg-gradient-to-br from-amber-50/90 via-rose-50/60 to-orange-50/80 border-2 border-amber-300 rounded-3xl p-8 text-center space-y-4 shadow-sm max-w-2xl mx-auto my-6">
                <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md text-3xl">
                  🔒
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif font-black text-2xl text-slate-900">
                    Verified Neighborhood Sitter &amp; Playhome Directory
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                    To safeguard child safety and preserve parent privacy under COPPA and Vernunt Safety Matrix, full profiles, distance radars, and hourly booking handshakes are available exclusively to verified logged-in parents.
                  </p>
                </div>

                <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-amber-200/80 text-left max-w-md mx-auto space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>🛡️</span> <span>What logged-in parents access:</span>
                  </div>
                  <ul className="space-y-1.5 pl-6 list-disc text-[11px] text-slate-600">
                    <li>Browse 100% Aadhaar &amp; background verified neighbour sitters</li>
                    <li>Distance-wise sorted playhomes and Montessori creches from 0.1km</li>
                    <li>4-Digit PIN dropoff &amp; pickup security handshakes with live updates</li>
                    <li>Transparent hourly rates (₹0 free co-op to ₹350/hr)</li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                      setIsRegisteringProvider(false);
                      const topSignInBtn = document.getElementById('btn-header-sign-in') || document.getElementById('login-main-google');
                      if (topSignInBtn) {
                        topSignInBtn.click();
                      }
                    }}
                    className="px-6 py-3 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Sign In to View Complete Sitter List
                  </button>

                  <button
                    id="btn-open-sitter-provider-modal"
                    type="button"
                    onClick={() => setIsRegisteringProvider(true)}
                    className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 font-black text-xs rounded-xl border border-slate-300 transition cursor-pointer"
                  >
                    🏠 Host Sitter / Playhome Registration
                  </button>
                </div>
              </div>
            ) : sortedAndFilteredProfiles.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-2">
                <p className="text-sm font-bold text-slate-700">No sitters matched your filter criteria.</p>
                <p className="text-xs text-slate-500">Try widening your distance slider or selecting "All Providers".</p>
                <button
                  type="button"
                  onClick={() => {
                    setMaxDistanceKm(15);
                    setSelectedProviderType('All');
                    setOnlyFreeCoop(false);
                  }}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl mt-2 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedAndFilteredProfiles.map((profile, idx) => {
                  const dist = profile.location.distance !== undefined ? profile.location.distance : 0.5 + idx * 0.4;
                  const estimatedTotal = profile.hourlyRate === 0 ? 0 : profile.hourlyRate * selectedDurationHours;
                  
                  return (
                    <div
                      key={profile.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group"
                    >
                      {/* Photo & Badge Overlay */}
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={profile.photos[0] || profile.avatarUrl}
                          alt={profile.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                        {/* Top Left Distance Tag (DISTANCE-WISE FOCUS) */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="bg-emerald-600/95 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-200" />
                            <span>{dist} km away</span>
                          </span>

                          <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">
                            {dist < 0.5 ? '🚶 4 min walk' : dist < 1.0 ? '🚶 10 min walk' : '🚗 5 min drive'}
                          </span>
                        </div>

                        {/* Top Right Hourly Rate (CRITICAL USER REQUEST - DUAL RATES SUPPORT) */}
                        <div className="absolute top-3 right-3">
                          <div className="bg-white/95 backdrop-blur-md text-slate-950 px-2.5 py-1.5 rounded-2xl shadow-md text-right border border-slate-100 flex flex-col gap-0.5">
                            {profile.hourlyRateNeighborHome !== undefined && (
                              <div className="text-right">
                                <span className="font-mono font-black text-xs text-emerald-700 block leading-none">
                                  {profile.hourlyRateNeighborHome === 0 ? '🏡 Free Co-Op' : `🏡 ₹${profile.hourlyRateNeighborHome}/hr`}
                                </span>
                                <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Host at Home</span>
                              </div>
                            )}
                            {profile.hourlyRateParentHome !== undefined && (
                              <div className="text-right border-t border-slate-100 pt-0.5">
                                <span className="font-mono font-black text-xs text-indigo-700 block leading-none">
                                  🚶‍♀️ ₹{profile.hourlyRateParentHome}/hr
                                </span>
                                <span className="text-[8.5px] text-slate-500 font-bold block uppercase">Visits You</span>
                              </div>
                            )}
                            {profile.hourlyRateNeighborHome === undefined && profile.hourlyRateParentHome === undefined && (
                              <div>
                                <span className="font-mono font-black text-sm text-rose-600 block leading-tight">
                                  {profile.hourlyRate === 0 ? '🎁 FREE' : `₹${profile.hourlyRate}/hr`}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold block">
                                  Hourly Rate
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Overlay Info */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                          <div className="flex items-center gap-2">
                            <img
                              src={profile.avatarUrl}
                              alt={profile.hostName}
                              className="w-8 h-8 rounded-full object-cover border-2 border-white shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-black block leading-tight truncate">
                                {profile.hostName}
                              </span>
                              <span className="text-[10px] text-slate-200 block truncate">
                                {profile.providerEntityType === 'individual' ? '👤 Individual Sitter' : '🏫 Daycare Center'} • {profile.experienceYears}y exp
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-black text-amber-300 flex items-center gap-0.5 justify-end">
                              ★ {profile.rating.toFixed(1)}
                            </span>
                            <span className="text-[9px] text-slate-300 block">
                              ({profile.reviewsCount} reviews)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Content Card Body */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        
                        <div>
                          {/* Title & Aadhaar Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                              {profile.title}
                            </h4>
                            {profile.aadhaarVerified && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0" title="Aadhaar ID Verified">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            )}
                          </div>

                          {/* Address & Visiting Range */}
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span>{profile.location.address}</span>
                          </p>

                          {/* Service Modes Pills */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(profile.careServiceModes || ['host_at_my_home']).map(mode => (
                              <span
                                key={mode}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  mode === 'host_at_my_home'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                }`}
                              >
                                {mode === 'host_at_my_home' ? '🏡 Hosts at Home/Center' : `🚶‍♀️ Visits Parents (within ${profile.visitingRadiusKm || 5}km)`}
                              </span>
                            ))}
                          </div>

                          {/* Bio */}
                          <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                            {profile.bio}
                          </p>

                          {/* Amenities Tag Cloud */}
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {profile.amenities.slice(0, 3).map((amenity, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                              >
                                {amenity}
                              </span>
                            ))}
                            {profile.amenities.length > 3 && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                                +{profile.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price Calculation for current time selection */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="bg-amber-50/70 p-2 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs mb-3">
                            <span className="text-[11px] text-amber-900 font-bold">
                              Estimate for {selectedDurationHours} hr session:
                            </span>
                            <span className="font-mono font-black text-rose-700">
                              {estimatedTotal === 0 ? '🎁 Free Co-Op' : `₹${estimatedTotal}`}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenChatWithUser) {
                                  onOpenChatWithUser(profile.id);
                                }
                              }}
                              className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              title="Chat / Inquire"
                            >
                              <MessageSquare className="w-4 h-4 text-slate-600" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setBookingModalProvider(profile)}
                              className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <span>Book Care / Sitter</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODALS */}
      {/* 1. Care Booking Modal */}
      {bookingModalProvider && (
        <CareBookingModal
          provider={bookingModalProvider}
          currentUserProfile={currentUserProfile}
          initialDate={selectedDate}
          initialStartTime={selectedStartTime}
          initialDurationHours={selectedDurationHours}
          onClose={() => setBookingModalProvider(null)}
          onSubmitBooking={(newBooking) => {
            onAddCareBooking(newBooking);
            setActiveSubView('my-bookings');
          }}
        />
      )}

      {/* 2. Care Provider Setup / Edit Modal */}
      {isRegisteringProvider && (
        <CareProviderRegistrationModal
          currentUserProfile={currentUserProfile}
          existingProfile={currentUserProviderProfile}
          onClose={() => setIsRegisteringProvider(false)}
          onSaveProfile={(profile) => {
            onSaveDaycareProfile(profile);
            setIsRegisteringProvider(false);
          }}
        />
      )}

      {/* 3. Care Handshake & PIN Verification Modal */}
      {selectedBookingForHandshake && (
        <CareHandshakeModal
          booking={selectedBookingForHandshake}
          currentUserProfile={currentUserProfile}
          onClose={() => setSelectedBookingForHandshake(null)}
          onUpdateBookingStatus={(bookingId, status, note) => {
            onUpdateBookingStatus(bookingId, status, note);
            // Refresh modal state
            const updated = careBookings.find(b => b.id === bookingId);
            if (updated) setSelectedBookingForHandshake(updated);
          }}
          onOpenChatWithUser={onOpenChatWithUser}
        />
      )}

    </div>
  );
}
