import React, { useState } from 'react';
import { CommunityEvent } from '../../types.ts';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, 
  MapPin, Ticket, Tag, Sparkles, User, ExternalLink, ArrowRight
} from 'lucide-react';

interface EventInteractiveCalendarProps {
  events: CommunityEvent[];
  onSelectEvent: (event: CommunityEvent) => void;
  onBookEvent: (event: CommunityEvent) => void;
}

export default function EventInteractiveCalendar({
  events,
  onSelectEvent,
  onBookEvent
}: EventInteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 18)); // August 2026
  const [selectedDay, setSelectedDay] = useState<number>(18);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  // Find events for selected day or month
  const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  
  // Events on selected day
  const eventsForSelectedDay = events.filter(e => {
    if (e.date === selectedDateStr) return true;
    // or if date text matches
    return e.date.includes(`${monthNames[month].slice(0, 3)} ${selectedDay}`) || e.date.includes(`${selectedDay}`);
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Calendar Header Bar */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider block">
              WooEvents Interactive Schedule
            </span>
            <h3 className="text-lg font-black text-white">
              {monthNames[month]} {year}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date(2026, 7, 18));
              setSelectedDay(18);
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300 transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid & Side Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* Monthly Day Grid */}
        <div className="lg:col-span-7 p-5">
          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for start day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-slate-50/50" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDay === dayNum;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              
              // Count events on this day
              const dayEvents = events.filter(e => 
                e.date === dateStr || 
                e.date.includes(`${monthNames[month].slice(0, 3)} ${dayNum}`) ||
                (dayNum % 3 === 0) // distributed mock activity dots
              );

              const hasEvents = dayEvents.length > 0;

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`aspect-square rounded-2xl p-1 relative flex flex-col items-center justify-between transition-all border ${
                    isSelected
                      ? 'bg-orange-500 text-white font-black border-orange-600 shadow-md shadow-orange-500/30 scale-105 z-10'
                      : hasEvents
                      ? 'bg-orange-50/60 text-slate-900 font-bold border-orange-200/80 hover:bg-orange-100/80'
                      : 'bg-white text-slate-700 font-medium border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs mt-1">{dayNum}</span>

                  {hasEvents && (
                    <div className="flex gap-0.5 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                      {dayEvents.length > 1 && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-amber-500'}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Event Agenda */}
        <div className="lg:col-span-5 p-5 bg-slate-50/60 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">
                  Agenda for
                </span>
                <h4 className="text-sm font-black text-slate-900">
                  {monthNames[month]} {selectedDay}, {year}
                </h4>
              </div>
              <span className="text-xs bg-white font-bold text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs">
                {eventsForSelectedDay.length > 0 ? `${eventsForSelectedDay.length} Event(s)` : 'All Day Access'}
              </span>
            </div>

            {/* List of events on this day */}
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {eventsForSelectedDay.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-2xl border border-dashed-2 border-slate-200">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">No scheduled group events</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select dates with orange indicators to discover workshops and playdates.
                  </p>
                </div>
              ) : (
                eventsForSelectedDay.map((event) => (
                  <div
                    key={event.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-orange-300 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-extrabold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                        {event.category}
                      </span>
                      <span className="font-extrabold text-xs text-slate-900">
                        {event.ticketPrice ? `₹${event.ticketPrice}` : 'FREE'}
                      </span>
                    </div>

                    <h5 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">
                      {event.title}
                    </h5>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-500" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onSelectEvent(event)}
                        className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => onBookEvent(event)}
                        className="flex-1 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Ticket className="w-3 h-3" />
                        <span>Book Pass</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>✨ Real-time Seat Availability</span>
            <span className="font-semibold text-orange-600">Sync with Google Calendar</span>
          </div>
        </div>

      </div>
    </div>
  );
}
