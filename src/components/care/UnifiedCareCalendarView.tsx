import React, { useState, useMemo } from 'react';
import { DaycarePlayhomeProfile, CareBookingRequest, ChildProfile } from '../../types.ts';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  MapPin, ShieldCheck, Star, CheckCircle2, AlertCircle, Baby, 
  Home, Briefcase, ArrowRight, Zap, Filter, Search, Sparkles, Users
} from 'lucide-react';

interface UnifiedCareCalendarViewProps {
  daycarePlayhomes: DaycarePlayhomeProfile[];
  careBookings: CareBookingRequest[];
  currentUserProfile: ChildProfile | null;
  onBookProvider: (provider: DaycarePlayhomeProfile, date: string, startTime: string, durationHours: number) => void;
  onOpenProviderCalendar: (provider: DaycarePlayhomeProfile) => void;
  onOpenChatWithUser?: (opponentId: string) => void;
}

export default function UnifiedCareCalendarView({
  daycarePlayhomes,
  careBookings,
  currentUserProfile,
  onBookProvider,
  onOpenProviderCalendar,
  onOpenChatWithUser
}: UnifiedCareCalendarViewProps) {
  // Calendar month state
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Time Window Filter
  const [timeWindow, setTimeWindow] = useState<'all' | 'morning' | 'afternoon' | 'evening' | 'fullday'>('all');
  
  // Service Mode Filter
  const [serviceMode, setServiceMode] = useState<'all' | 'host_at_my_home' | 'visit_parents_home'>('all');

  // Search keyword filter
  const [searchFilter, setSearchFilter] = useState<string>('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    const prevPaddingDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDaysCount - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      prevPaddingDays.push({ day: d, dateStr, isCurrentMonth: false });
    }

    const currentDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      currentDays.push({ day: d, dateStr, isCurrentMonth: true });
    }

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

  // For any date, count how many providers are available
  const getAvailableProvidersForDate = (dateStr: string) => {
    const [dY, dM, dD] = dateStr.split('-').map(Number);
    const dateObj = new Date(dY, dM - 1, dD);
    const dayOfWeekShort = dayShortNames[dateObj.getDay()].toLowerCase();

    return daycarePlayhomes.filter(p => {
      // Check if blocked
      const blocked = p.calendarSchedule?.blockedDates || [];
      if (blocked.includes(dateStr)) return false;

      // Check operating days
      const days = (p.availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(d => d.slice(0, 3).toLowerCase());
      if (!days.includes(dayOfWeekShort)) return false;

      // Check booking capacity
      const bookingsOnDate = careBookings.filter(b => b.providerId === p.id && b.date === dateStr && b.status !== 'Cancelled' && b.status !== 'Declined');
      const maxCap = p.maxCapacity || 4;
      if (bookingsOnDate.length >= maxCap) return false;

      return true;
    });
  };

  // Selected date parsed
  const selectedDateObj = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDateStr]);

  const formattedSelectedDate = useMemo(() => {
    return selectedDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [selectedDateObj]);

  // Filtered providers available on the selected date
  const providersAvailableOnSelectedDate = useMemo(() => {
    const baseList = getAvailableProvidersForDate(selectedDateStr);

    return baseList.filter(p => {
      // Service Mode Filter
      if (serviceMode !== 'all') {
        const modes = p.careServiceModes || ['host_at_my_home'];
        if (!modes.includes(serviceMode)) return false;
      }

      // Time Window Filter
      if (timeWindow !== 'all') {
        const slots = p.availableTimeSlots || [];
        const slotsJoined = slots.join(' ').toLowerCase();

        if (timeWindow === 'morning') {
          const hasMorning = slotsJoined.includes('am') || slotsJoined.includes('08:') || slotsJoined.includes('09:') || slotsJoined.includes('10:') || slotsJoined.includes('morning');
          if (!hasMorning) return false;
        } else if (timeWindow === 'afternoon') {
          const hasAfternoon = slotsJoined.includes('01:') || slotsJoined.includes('02:') || slotsJoined.includes('03:') || slotsJoined.includes('04:') || slotsJoined.includes('pm') || slotsJoined.includes('afternoon');
          if (!hasAfternoon) return false;
        } else if (timeWindow === 'evening') {
          const hasEvening = slotsJoined.includes('05:') || slotsJoined.includes('06:') || slotsJoined.includes('07:') || slotsJoined.includes('08:') || slotsJoined.includes('evening');
          if (!hasEvening) return false;
        } else if (timeWindow === 'fullday') {
          const hasFull = slotsJoined.includes('full day') || p.fullDayRate !== undefined;
          if (!hasFull) return false;
        }
      }

      // Search keyword filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchHost = p.hostName.toLowerCase().includes(q);
        const matchAddr = p.location.address.toLowerCase().includes(q);
        if (!matchTitle && !matchHost && !matchAddr) return false;
      }

      return true;
    }).sort((a, b) => {
      // Closest first
      const distA = a.location.distance !== undefined ? a.location.distance : 99;
      const distB = b.location.distance !== undefined ? b.location.distance : 99;
      return distA - distB;
    });
  }, [selectedDateStr, serviceMode, timeWindow, searchFilter, daycarePlayhomes, careBookings]);

  return (
    <div className="space-y-6">
      
      {/* 1. CALENDAR BANNER HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-rose-300 border border-rose-500/30">
            <CalendarIcon className="w-3.5 h-3.5 text-rose-400" />
            <span>Interactive Availability Booking Calendar</span>
          </div>

          <h2 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
            Check Sitter &amp; Playhome Availability by Date
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            Planning ahead or need urgent emergency care? Pick any date on the calendar to see verified local child sitters and playhomes with open booking capacity in real-time.
          </p>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-12 -bottom-12 w-60 h-60 rounded-full bg-rose-600/10 blur-2xl pointer-events-none" />
      </div>

      {/* 2. CALENDAR + DAY MATCHER SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: MONTHLY AVAILABILITY CALENDAR (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          
          {/* Month Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-serif font-black text-lg text-slate-900 leading-tight">
                {monthNames[month]} {year}
              </h3>
              <span className="text-[11px] text-slate-500 font-bold">
                Select a date to view available caregivers
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDateStr(todayStr);
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayShortNames.map((d, i) => (
              <div 
                key={d} 
                className={`py-1 text-[10px] font-black uppercase tracking-wider ${
                  i === 0 ? 'text-rose-500' : 'text-slate-500'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Matrix */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const count = getAvailableProvidersForDate(cell.dateStr).length;
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === todayStr;
              const isPast = cell.dateStr < todayStr;

              let cellStyle = 'bg-slate-50 text-slate-800 hover:bg-slate-100 border-slate-200';
              if (isPast) {
                cellStyle = 'bg-slate-50/50 text-slate-300 border-transparent cursor-not-allowed';
              } else if (count > 0) {
                cellStyle = 'bg-emerald-50/70 text-emerald-950 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-400';
              } else {
                cellStyle = 'bg-slate-100 text-slate-400 border-slate-200';
              }

              if (!cell.isCurrentMonth) {
                cellStyle += ' opacity-35';
              }

              return (
                <button
                  key={`${cell.dateStr}-${idx}`}
                  type="button"
                  onClick={() => {
                    if (!isPast) {
                      setSelectedDateStr(cell.dateStr);
                    }
                  }}
                  disabled={isPast}
                  className={`relative p-2 rounded-2xl border text-center min-h-[58px] flex flex-col items-center justify-between transition cursor-pointer ${cellStyle} ${
                    isSelected
                      ? 'ring-2 ring-rose-600 border-rose-600 font-black bg-rose-50 text-rose-900 shadow-sm'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black">{cell.day}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" title="Today" />
                    )}
                  </div>

                  {!isPast && (
                    <div className="mt-1">
                      {count > 0 ? (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-600 text-white">
                          {count} open
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium">None</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Legend */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Available Sitters</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>No Sitters Active</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>Selected Day</span>
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: PROVIDERS MATCHED ON SELECTED DATE (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Date & Filter Tooling Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-block">
                  Available Caregivers
                </span>
                <h3 className="font-serif font-black text-lg text-slate-900 mt-0.5">
                  {formattedSelectedDate}
                </h3>
              </div>

              <div className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-full shrink-0">
                Found <strong>{providersAvailableOnSelectedDate.length}</strong> available sitters &amp; daycares
              </div>
            </div>

            {/* Time Window Pills & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Time Window */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Time:
                </span>
                {[
                  { id: 'all', label: 'Any Time' },
                  { id: 'morning', label: 'Morning (8AM-12PM)' },
                  { id: 'afternoon', label: 'Afternoon (12PM-5PM)' },
                  { id: 'evening', label: 'Evening (5PM-9PM)' },
                  { id: 'fullday', label: 'Full Day' }
                ].map(tw => (
                  <button
                    key={tw.id}
                    type="button"
                    onClick={() => setTimeWindow(tw.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      timeWindow === tw.id
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tw.label}
                  </button>
                ))}
              </div>

              {/* Service Mode Selector */}
              <div className="flex items-center gap-1.5">
                <select
                  value={serviceMode}
                  onChange={(e) => setServiceMode(e.target.value as any)}
                  className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="all">All Service Modes</option>
                  <option value="host_at_my_home">🏡 Drop-off at Host</option>
                  <option value="visit_parents_home">🚶‍♀️ Sitter Visits Parent</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search caregiver by name, locality, or center..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-rose-600 focus:bg-white"
              />
            </div>
          </div>

          {/* List of Matched Providers for Selected Date */}
          {providersAvailableOnSelectedDate.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                📅
              </div>
              <h4 className="font-serif font-black text-base text-slate-900">
                No Caregivers Available on {formattedSelectedDate}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try selecting another date on the calendar, or change the time window filter (e.g. "Any Time").
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {providersAvailableOnSelectedDate.map((provider) => {
                const dist = provider.location.distance !== undefined ? provider.location.distance : 1.2;
                const dropOffRate = provider.hourlyRateNeighborHome !== undefined ? provider.hourlyRateNeighborHome : provider.hourlyRate;
                const homeVisitRate = provider.hourlyRateParentHome !== undefined ? provider.hourlyRateParentHome : provider.hourlyRate;
                const firstSlot = (provider.availableTimeSlots && provider.availableTimeSlots[0]) || '10:00 AM - 01:00 PM';
                const firstStartTime = firstSlot.split(' - ')[0] || '10:00 AM';

                return (
                  <div
                    key={provider.id}
                    className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={provider.avatarUrl}
                        alt={provider.hostName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {provider.title}
                          </h4>
                          {provider.aadhaarVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" title="Aadhaar Verified" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          Host: <strong>{provider.hostName}</strong> • {provider.providerType}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {dist} km away
                          </span>

                          <span className="font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            ★ {provider.rating.toFixed(1)}
                          </span>

                          <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {firstSlot}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Rates & Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="font-mono font-black text-base text-rose-700 block leading-tight">
                          {dropOffRate === 0 ? '🎁 Free Co-Op' : `₹${dropOffRate}/hr`}
                        </span>
                        {provider.hourlyRateParentHome !== undefined && (
                          <span className="text-[10px] text-indigo-700 font-bold block">
                            🚶‍♀️ Home Visit: ₹{homeVisitRate}/hr
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenProviderCalendar(provider)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <CalendarIcon className="w-3.5 h-3.5 text-rose-600" />
                          <span>View Calendar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onBookProvider(provider, selectedDateStr, firstStartTime, 2)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Book</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
