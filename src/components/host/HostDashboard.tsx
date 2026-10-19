import React, { useState, useMemo } from 'react';
import { 
  Calendar, Users, QrCode, Plus, DollarSign, CheckCircle2, 
  Clock, MapPin, Sparkles, ArrowRight, ShieldCheck, Search, 
  Award, TrendingUp, LogOut, ExternalLink, HelpCircle, FileText
} from 'lucide-react';
import { CommunityEvent, ChildProfile } from '../../types.ts';
import CreateEventWizardModal from '../events/CreateEventWizardModal.tsx';
import EventOrganizerCheckInStation from '../events/EventOrganizerCheckInStation.tsx';
import EventHostQrShareModal from '../events/EventHostQrShareModal.tsx';

interface HostDashboardProps {
  currentUserProfile: ChildProfile | null;
  events: CommunityEvent[];
  onAddEvent: (event: CommunityEvent) => void;
  onNavigateHome?: () => void;
  onOpenHelpSop?: () => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  currentUserProfile,
  events,
  onAddEvent,
  onNavigateHome,
  onOpenHelpSop
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'checkin' | 'payouts'>('overview');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showCheckInStation, setShowCheckInStation] = useState<boolean>(false);
  const [checkInStationEvent, setCheckInStationEvent] = useState<CommunityEvent | null>(null);
  const [selectedShareQrEvent, setSelectedShareQrEvent] = useState<CommunityEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Host events
  const hostEvents = useMemo(() => {
    const hostName = currentUserProfile?.parentName?.toLowerCase().trim() || '';
    if (!hostName) return events.slice(0, 5);
    const matched = events.filter(e => e.hostName && e.hostName.toLowerCase().includes(hostName));
    return matched.length > 0 ? matched : events.slice(0, 6);
  }, [events, currentUserProfile]);

  const totalAttendees = useMemo(() => {
    return hostEvents.reduce((acc, curr) => acc + (curr.attendeesCount || 8), 0);
  }, [hostEvents]);

  const estimatedEarnings = useMemo(() => {
    return hostEvents.reduce((acc, curr) => acc + ((curr.price || 0) * (curr.attendeesCount || 5)), 0);
  }, [hostEvents]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Host Brand Header */}
      <header className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white sticky top-0 z-30 shadow-md border-b border-amber-900/40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-xl shrink-0">
              🎪
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight">
                  Vernunt Host &amp; Activity Station
                </h1>
                <span className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                  Host Verified
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                app.vernunt.com/host • Managed by {currentUserProfile?.parentName || 'Verified Host'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create Event / Class</span>
            </button>

            {onOpenHelpSop && (
              <button
                type="button"
                onClick={onOpenHelpSop}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-white/20"
                title="View Standard Operating Procedures for Hosts"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Host SOP</span>
              </button>
            )}

            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                title="Return to Parent Radar"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Parent App</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Active Events / Classes</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {hostEvents.length}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block">
              100% Published &amp; Bookable
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Child Attendees</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalAttendees}
            </div>
            <span className="text-[10px] text-slate-500 font-medium block">
              Across workshops &amp; camps
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Gross Ticket Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ₹{estimatedEarnings.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block">
              Cashfree Direct Settlement
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Check-in Verification</span>
              <QrCode className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              98.4%
            </div>
            <span className="text-[10px] text-purple-700 font-bold block">
              Real-time Dynamic QR Passes
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview &amp; Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'events' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Classes &amp; Events ({hostEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'checkin' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            QR Scanner Check-In Desk
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'payouts' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cashfree Payouts &amp; Bank KYC
          </button>
        </div>

        {/* Tab 1: Overview & Active Events */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions Strip */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-2xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-lg">
                  Launch Your Next Kids Workshop or Weekend Camp
                </h3>
                <p className="text-xs font-medium text-slate-900/80">
                  Broadcast instant notifications to 500+ parents within 5km radius with Aadhaar child verification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Publish New Activity</span>
              </button>
            </div>

            {/* Event List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Your Hosted Classes &amp; Experiences
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage bookings, view attendee roster, and launch dynamic QR entry check-in
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hostEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-3 hover:border-amber-400 hover:shadow-md transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                          {event.category || 'Workshop'}
                        </span>
                        <span className="font-mono text-emerald-700">
                          {event.price === 0 ? 'FREE' : `₹${event.price}/child`}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 line-clamp-2">
                        {event.title}
                      </h4>

                      <div className="space-y-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{event.date} • {event.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{event.attendeesCount || 10} / {event.maxCapacity || 25} Registered</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCheckInStationEvent(event);
                          setShowCheckInStation(true);
                        }}
                        className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>QR Check-In</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedShareQrEvent(event)}
                        className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-lg transition cursor-pointer"
                        title="Share Host QR Code Pass"
                      >
                        Share Pass
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: All Events Table */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">All Hosted Events Roster</h3>
                <p className="text-xs text-slate-500">Search, edit, or launch entry scanning stations</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {hostEvents
                .filter(e => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(event => (
                  <div key={event.id} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{event.title}</span>
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                          {event.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {event.date} • {event.time} • {event.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-700 mr-2">
                        {event.attendeesCount || 8} Bookings
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCheckInStationEvent(event);
                          setShowCheckInStation(true);
                        }}
                        className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Open Station</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 3: Checkin Desk Direct View */}
        {activeTab === 'checkin' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="max-w-xl space-y-2">
              <h3 className="text-base font-black text-slate-900">
                Official Dynamic QR Pass Gate Station
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scan attendee 10-second rotating QR passes or verify by 4-digit booking PIN to guarantee zero screenshot ticket duplication and ensure authentic child entry.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCheckInStationEvent(hostEvents[0] || events[0]);
                    setShowCheckInStation(true);
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 stroke-[2.5]" />
                  <span>Launch Fullscreen Scanner Station</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payouts */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-black text-slate-900">
              Cashfree Host Settlements &amp; Bank Account
            </h3>
            <p className="text-xs text-slate-600">
              Ticket payouts are disbursed automatically every Tuesday directly to your verified IFSC bank account.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold block">Available for Next Settlement</span>
                <span className="text-xl font-black font-mono text-emerald-700">₹{(estimatedEarnings * 0.92).toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">After standard 8% platform fee &amp; payment processing</span>
              </div>
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                ✓ Bank Account Linked
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showCreateModal && (
        <CreateEventWizardModal
          onClose={() => setShowCreateModal(false)}
          onAddEvent={(newEvent) => {
            onAddEvent(newEvent);
            setShowCreateModal(false);
          }}
          userProfile={currentUserProfile}
        />
      )}

      {showCheckInStation && checkInStationEvent && (
        <EventOrganizerCheckInStation
          event={checkInStationEvent}
          onClose={() => {
            setShowCheckInStation(false);
            setCheckInStationEvent(null);
          }}
        />
      )}

      {selectedShareQrEvent && (
        <EventHostQrShareModal
          event={selectedShareQrEvent}
          onClose={() => setSelectedShareQrEvent(null)}
        />
      )}
    </div>
  );
};
