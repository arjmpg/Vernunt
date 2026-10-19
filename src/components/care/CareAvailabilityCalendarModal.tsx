import React, { useState, useMemo } from 'react';
import { DaycarePlayhomeProfile, CareBookingRequest, ChildProfile } from '../../types.ts';
import { 
  X, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  MapPin, ShieldCheck, Star, CheckCircle2, AlertCircle, Baby, 
  Home, Briefcase, ArrowRight, Zap, Info, Filter, Sparkles
} from 'lucide-react';

interface CareAvailabilityCalendarModalProps {
  provider: DaycarePlayhomeProfile;
  careBookings: CareBookingRequest[];
  currentUserProfile: ChildProfile | null;
  onClose: () => void;
  onSelectSlotToBook: (
    provider: DaycarePlayhomeProfile,
    date: string,
    startTime: string,
    durationHours: number,
    serviceMode?: 'host_at_my_home' | 'visit_parents_home'
  ) => void;
}

export default function CareAvailabilityCalendarModal({
  provider,
  careBookings,
  currentUserProfile,
  onClose,
  onSelectSlotToBook
}: CareAvailabilityCalendarModalProps) {
  // Calendar View Month & Date
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  
  // Format today's YYYY-MM-DD string
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Selected date on calendar (defaults to today or tomorrow)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Selected Service Mode filter
  const availableModes = provider.careServiceModes || ['host_at_my_home'];
  const [selectedServiceMode, setSelectedServiceMode] = useState<'all' | 'host_at_my_home' | 'visit_parents_home'>('all');

  // Selected Time Slot for the active date
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [customDurationHours, setCustomDurationHours] = useState<number>(2);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Current year & month
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateStr(todayStr);
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Days from previous month to pad start
    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    const prevPaddingDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDaysCount - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      prevPaddingDays.push({ day: d, dateStr, isCurrentMonth: false });
    }

    // Days in current month
    const currentDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      currentDays.push({ day: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding to fill grid to 35 or 42 cells
    const totalFilled = prevPaddingDays.length + currentDays.length;
    const nextPaddingNeeded = (Math.ceil(totalFilled / 7) * 7) - totalFilled;
    const nextPaddingDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= nextPaddingNeeded; d++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      nextPaddingDays.push({ day: d, dateStr, isCurrentMonth: false });
    }

    return [...prevPaddingDays, ...currentDays, ...nextPaddingDays];
  }, [year, month]);

  // Provider's allowed days of week
  const providerAllowedDays = useMemo(() => {
    const raw = provider.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return raw.map(d => d.slice(0, 3).toLowerCase());
  }, [provider.availableDays]);

  // Blocked dates
  const blockedDates = useMemo(() => {
    return new Set(provider.calendarSchedule?.blockedDates || []);
  }, [provider.calendarSchedule]);

  // Bookings mapped by date for this provider
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CareBookingRequest[]>();
    careBookings.forEach(b => {
      if (b.providerId === provider.id && b.status !== 'Cancelled' && b.status !== 'Declined') {
        const list = map.get(b.date) || [];
        list.push(b);
        map.set(b.date, list);
      }
    });
    return map;
  }, [careBookings, provider.id]);

  // Compute status for a date
  const getDateAvailability = (dateStr: string) => {
    const [dYear, dMonth, dDay] = dateStr.split('-').map(Number);
    const dateObj = new Date(dYear, dMonth - 1, dDay);
    const dayOfWeekShort = dayShortNames[dateObj.getDay()].toLowerCase();

    // Check if past
    const isPast = dateStr < todayStr;
    if (isPast) {
      return { status: 'past', label: 'Past Date', spotsLeft: 0, isBookable: false };
    }

    // Check if manually blocked
    if (blockedDates.has(dateStr)) {
      return { status: 'blocked', label: 'Host on Leave / Blocked', spotsLeft: 0, isBookable: false };
    }

    // Check if working day of week
    const isWorkingDay = providerAllowedDays.includes(dayOfWeekShort);
    if (!isWorkingDay) {
      return { status: 'off', label: 'Day Off', spotsLeft: 0, isBookable: false };
    }

    // Capacity calculation
    const existingBookings = bookingsByDate.get(dateStr) || [];
    const maxCapacity = provider.maxCapacity || 4;
    const spotsLeft = Math.max(0, maxCapacity - existingBookings.length);

    if (spotsLeft === 0) {
      return { status: 'full', label: 'Fully Booked', spotsLeft: 0, isBookable: false };
    } else if (spotsLeft <= 1) {
      return { status: 'limited', label: '1 Spot Left', spotsLeft, isBookable: true };
    } else {
      return { status: 'available', label: `${spotsLeft} Spots Available`, spotsLeft, isBookable: true };
    }
  };

  // Selected date info
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDateStr]);

  const selectedDateAvailability = useMemo(() => {
    return getDateAvailability(selectedDateStr);
  }, [selectedDateStr, bookingsByDate, blockedDates, providerAllowedDays]);

  const formattedSelectedDate = useMemo(() => {
    return selectedDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDateObj]);

  // Standard Available Slots for selected date
  const availableSlotsForDate = useMemo(() => {
    const rawSlots = provider.availableTimeSlots && provider.availableTimeSlots.length > 0
      ? provider.availableTimeSlots
      : [
          '09:00 AM - 01:00 PM',
          '02:00 PM - 06:00 PM',
          '06:00 PM - 09:00 PM',
          'Full Day (9 AM - 6 PM)'
        ];

    const existingBookings = bookingsByDate.get(selectedDateStr) || [];

    return rawSlots.map((slotStr, idx) => {
      // Determine slot timing and duration
      let startTime = '10:00 AM';
      let duration = 3;
      let label = 'Standard Slot';

      if (slotStr.includes(' - ')) {
        const parts = slotStr.split(' - ');
        startTime = parts[0].trim();
        if (slotStr.toLowerCase().includes('full day')) {
          label = 'Full Day Care (8h)';
          duration = 8;
        } else if (idx === 0) {
          label = 'Morning Session (4h)';
          duration = 4;
        } else if (idx === 1) {
          label = 'Afternoon Play & Rest (4h)';
          duration = 4;
        } else {
          label = 'Evening Sitter (3h)';
          duration = 3;
        }
      } else if (slotStr.toLowerCase().includes('full day')) {
        label = 'Full Day Session';
        startTime = '09:00 AM';
        duration = 8;
      }

      // Check if slot has conflicting booking
      const bookedInThisSlot = existingBookings.filter(b => b.startTime.includes(startTime.slice(0, 5))).length;
      const slotCapacity = provider.maxCapacity || 4;
      const slotsRemaining = Math.max(0, slotCapacity - bookedInThisSlot);
      const isSlotAvailable = slotsRemaining > 0 && selectedDateAvailability.isBookable;

      return {
        id: `slot-${idx}`,
        slotStr,
        label,
        startTime,
        duration,
        slotsRemaining,
        slotCapacity,
        isSlotAvailable
      };
    });
  }, [provider.availableTimeSlots, provider.maxCapacity, bookingsByDate, selectedDateStr, selectedDateAvailability]);

  // Hourly rate preview
  const dropOffRate = provider.hourlyRateNeighborHome !== undefined ? provider.hourlyRateNeighborHome : provider.hourlyRate;
  const visitRate = provider.hourlyRateParentHome !== undefined ? provider.hourlyRateParentHome : provider.hourlyRate;

  // Active rate based on mode
  const effectiveRate = selectedServiceMode === 'visit_parents_home'
    ? visitRate
    : dropOffRate;

  // Handle direct slot booking click
  const handleBookSlot = (slot: typeof availableSlotsForDate[0]) => {
    const chosenMode = selectedServiceMode === 'all'
      ? (availableModes.includes('host_at_my_home') ? 'host_at_my_home' : 'visit_parents_home')
      : selectedServiceMode;

    onSelectSlotToBook(
      provider,
      selectedDateStr,
      slot.startTime,
      slot.duration,
      chosenMode
    );
  };

  const handleBookCustomTime = (startTime: string, duration: number) => {
    const chosenMode = selectedServiceMode === 'all'
      ? (availableModes.includes('host_at_my_home') ? 'host_at_my_home' : 'visit_parents_home')
      : selectedServiceMode;

    onSelectSlotToBook(
      provider,
      selectedDateStr,
      startTime,
      duration,
      chosenMode
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. MODAL TOP HEADER */}
        <div className="bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 p-5 sm:p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3.5">
              <img
                src={provider.avatarUrl}
                alt={provider.hostName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/80 shadow-md shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3 text-amber-200" /> Host Availability Calendar
                  </span>
                  {provider.isAcceptingNow && (
                    <span className="text-[10px] font-extrabold bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Accepting Now
                    </span>
                  )}
                  {provider.instantBooking && (
                    <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3 text-slate-950" /> Instant Book
                    </span>
                  )}
                </div>

                <h2 className="font-serif font-black text-xl sm:text-2xl text-white mt-1 leading-tight">
                  {provider.title}
                </h2>

                <p className="text-xs text-orange-100 flex items-center gap-2 mt-0.5">
                  <span className="font-bold">{provider.hostName}</span>
                  <span>•</span>
                  <span>{provider.providerType}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-200 font-bold">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                    {provider.rating.toFixed(1)} ({provider.reviewsCount} reviews)
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Rates Banner */}
            <div className="bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-orange-200 block">
                  {dropOffRate === 0 ? 'Reciprocal Co-Op' : 'Hourly Care Rate'}
                </span>
                <span className="font-mono text-base sm:text-lg font-black text-white">
                  {dropOffRate === 0 ? '🎁 Free' : `₹${dropOffRate}/hr`}
                </span>
              </div>
              {provider.hourlyRateParentHome !== undefined && (
                <div className="text-right text-[10px] text-white/90">
                  <span>Home Visit: </span>
                  <span className="font-mono font-bold text-amber-200">₹{provider.hourlyRateParentHome}/hr</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. SUB-BAR: SERVICE MODE SELECTION & INSTRUCTIONS */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-bold text-[11px] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-500" /> Care Mode:
            </span>
            <div className="flex rounded-xl bg-white border border-slate-200 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedServiceMode('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedServiceMode === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Modes
              </button>
              {availableModes.includes('host_at_my_home') && (
                <button
                  type="button"
                  onClick={() => setSelectedServiceMode('host_at_my_home')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedServiceMode === 'host_at_my_home'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Home className="w-3 h-3" /> Drop-off at Host
                </button>
              )}
              {availableModes.includes('visit_parents_home') && (
                <button
                  type="button"
                  onClick={() => setSelectedServiceMode('visit_parents_home')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    selectedServiceMode === 'visit_parents_home'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3 h-3" /> Sitter Visits Parent
                </button>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 1 Spot Left
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Booked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Day Off
            </span>
          </div>
        </div>

        {/* 3. CALENDAR & TIME SLOTS SPLIT BODY */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: MONTHLY CALENDAR GRID (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Calendar Month Navigation Header */}
            <div className="flex items-center justify-between bg-slate-100/80 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-black text-base text-slate-900 leading-tight">
                    {monthNames[month]} {year}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Click any day to view open hours & book
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-300 transition cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleGoToToday}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center border border-slate-300 transition cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {dayShortNames.map((d, i) => (
                <div 
                  key={d} 
                  className={`py-1 text-[11px] font-black uppercase tracking-wider ${
                    i === 0 ? 'text-rose-500' : 'text-slate-600'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell, idx) => {
                const avail = getDateAvailability(cell.dateStr);
                const isSelected = cell.dateStr === selectedDateStr;
                const isToday = cell.dateStr === todayStr;

                // Color schemes based on availability
                let cellBg = 'bg-white hover:bg-slate-50 border-slate-200';
                let indicatorColor = 'bg-emerald-500';
                let badgeText = '';

                if (avail.status === 'past') {
                  cellBg = 'bg-slate-50/60 text-slate-300 border-slate-100 cursor-not-allowed';
                  indicatorColor = 'bg-slate-200';
                } else if (avail.status === 'off') {
                  cellBg = 'bg-slate-100/70 text-slate-400 border-slate-200/80 cursor-pointer';
                  indicatorColor = 'bg-slate-300';
                  badgeText = 'Off';
                } else if (avail.status === 'blocked') {
                  cellBg = 'bg-rose-50/50 text-rose-400 border-rose-200 cursor-pointer';
                  indicatorColor = 'bg-rose-400';
                  badgeText = 'Leave';
                } else if (avail.status === 'full') {
                  cellBg = 'bg-rose-50 text-rose-700 border-rose-200 cursor-pointer';
                  indicatorColor = 'bg-rose-500';
                  badgeText = 'Full';
                } else if (avail.status === 'limited') {
                  cellBg = 'bg-amber-50/70 text-amber-900 border-amber-300 cursor-pointer hover:border-amber-400';
                  indicatorColor = 'bg-amber-500';
                  badgeText = '1 left';
                } else if (avail.status === 'available') {
                  cellBg = 'bg-emerald-50/60 text-emerald-950 border-emerald-300/80 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50';
                  indicatorColor = 'bg-emerald-500';
                  badgeText = `${avail.spotsLeft} free`;
                }

                if (!cell.isCurrentMonth) {
                  cellBg += ' opacity-35';
                }

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    onClick={() => {
                      if (avail.status !== 'past') {
                        setSelectedDateStr(cell.dateStr);
                      }
                    }}
                    disabled={avail.status === 'past'}
                    className={`relative p-2 rounded-2xl border text-left min-h-[62px] flex flex-col justify-between transition group ${cellBg} ${
                      isSelected
                        ? 'ring-2 ring-rose-600 border-rose-600 shadow-md font-black bg-rose-50/40'
                        : ''
                    }`}
                  >
                    {/* Top Row: Day Number & Today Tag */}
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black ${
                        isSelected ? 'text-rose-700' : 'text-slate-800'
                      }`}>
                        {cell.day}
                      </span>
                      {isToday && (
                        <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-rose-600 text-white">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Bottom Indicator Pill */}
                    <div className="w-full mt-1">
                      {avail.status !== 'past' && (
                        <div className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${indicatorColor}`} />
                          <span className="text-[9px] font-extrabold truncate block">
                            {badgeText || (avail.isBookable ? 'Open' : 'Off')}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Operating Schedule Notice */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-800">
                  Regular Working Days: {provider.availableDays.join(', ')}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Max capacity: {provider.maxCapacity || 4} children at a time. Verified drop-off PIN issued instantly upon booking.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT: SELECTED DATE TIME SLOTS & DIRECT BOOKING ACTION (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-slate-50/80 p-5 rounded-3xl border border-slate-200">
            
            <div className="space-y-4">
              {/* Date Header Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-block">
                  Selected Date
                </span>
                <h4 className="font-serif font-black text-lg text-slate-900 mt-1">
                  {formattedSelectedDate}
                </h4>
                
                {/* Status Callout */}
                <div className={`mt-2 p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                  selectedDateAvailability.status === 'available'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : selectedDateAvailability.status === 'limited'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : selectedDateAvailability.status === 'full'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : selectedDateAvailability.status === 'blocked'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {selectedDateAvailability.isBookable ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>
                    {selectedDateAvailability.status === 'available' && `🟢 ${selectedDateAvailability.spotsLeft} of ${provider.maxCapacity || 4} spots open today`}
                    {selectedDateAvailability.status === 'limited' && `🟡 Hurry! Only 1 spot remaining today`}
                    {selectedDateAvailability.status === 'full' && `🔴 All spots booked for this date`}
                    {selectedDateAvailability.status === 'off' && `⚪ Caregiver does not operate on this day`}
                    {selectedDateAvailability.status === 'blocked' && `⚪ Caregiver is on planned leave`}
                  </span>
                </div>
              </div>

              {/* Time Slots List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>Available Time Slots</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {availableSlotsForDate.length} options
                  </span>
                </div>

                {selectedDateAvailability.isBookable ? (
                  <div className="space-y-2">
                    {availableSlotsForDate.map((slot, idx) => {
                      const estimatedSlotCost = effectiveRate * slot.duration;
                      const isSelectedSlot = selectedSlotIndex === idx;

                      return (
                        <div
                          key={slot.id}
                          className={`p-3.5 rounded-2xl border transition ${
                            isSelectedSlot
                              ? 'bg-white border-rose-600 ring-2 ring-rose-200 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-slate-900">
                                  {slot.startTime}
                                </span>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                  {slot.duration} {slot.duration === 1 ? 'hr' : 'hrs'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                                {slot.label} ({slot.slotStr})
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-mono font-black text-sm text-rose-700 block">
                                {estimatedSlotCost === 0 ? '🎁 Free' : `₹${estimatedSlotCost}`}
                              </span>
                              <span className="text-[9px] text-slate-500 font-bold">
                                {effectiveRate === 0 ? 'Co-Op' : `₹${effectiveRate}/hr`}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                            <span className="text-[10.5px] font-bold text-emerald-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{slot.slotsRemaining} of {slot.slotCapacity} spots free</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSlotIndex(idx);
                                handleBookSlot(slot);
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white font-extrabold text-[11px] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <span>Book Slot</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">
                      No slots open on {formattedSelectedDate}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Please pick another highlighted green date from the calendar to view available morning or afternoon slots.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Custom Hours Section */}
              {selectedDateAvailability.isBookable && (
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Or Custom Duration (Hours)</span>
                    </span>
                    <span className="text-xs font-mono font-black text-rose-700">
                      {customDurationHours * effectiveRate === 0 ? 'Free' : `₹${customDurationHours * effectiveRate}`}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 8].map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setCustomDurationHours(h)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          customDurationHours === h
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookCustomTime('10:00 AM', customDurationHours)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Book Custom {customDurationHours}h on {selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Modal Close */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                Close Calendar
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
