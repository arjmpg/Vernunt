import React, { useState, useEffect } from 'react';
import { CommunityHostMeetup, ChildProfile } from '../../types.ts';
import { 
  Users, 
  Video, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  ShieldCheck, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Share2, 
  ChevronRight,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CommunityHostingHubProps {
  userProfile: ChildProfile | null;
}

const INITIAL_HOSTS: CommunityHostMeetup[] = [
  {
    id: 'host-1',
    title: 'Saturday Cubbon Park Stroller & Coffee Catchup ☕',
    description: 'Casual morning walk near the Bandstand followed by coffee while babies nap or play on picnic blankets.',
    hostId: 'seed-mom-1',
    hostName: 'Ananya Sharma',
    hostRole: 'Mom of 8-month-old',
    hostGender: 'Mother',
    isVirtual: false,
    locationName: 'Cubbon Park Bandstand, Bengaluru',
    date: '2026-09-12',
    time: '08:30 AM - 10:30 AM',
    genderRestriction: 'Female Only',
    maxAttendees: 15,
    rsvpUserIds: ['seed-mom-1', 'demo-user-1'],
    rsvpCount: 8,
    category: 'Stroller Walk'
  },
  {
    id: 'host-2',
    title: 'Virtual Lactation & Pumping Q&A with IBCLC Expert 💻',
    description: 'Ask anything about returning to work, milk storage, breast pump flanges, and weaning tips. Live Google Meet video call.',
    hostId: 'seed-exp-1',
    hostName: 'Dr. Alisha Verghese',
    hostRole: 'Pediatric Lactation Consultant',
    hostGender: 'Mother',
    isVirtual: true,
    meetingUrl: 'https://meet.google.com/ver-nunt-meet',
    date: '2026-09-14',
    time: '06:00 PM - 07:00 PM',
    genderRestriction: 'Female Only',
    maxAttendees: 50,
    rsvpUserIds: ['seed-exp-1'],
    rsvpCount: 28,
    category: 'Expert Circle'
  },
  {
    id: 'host-3',
    title: 'Sunday Morning Dads & Kids Football Kickabout ⚽',
    description: 'Bring footballs, cones, and water bottles. Fun agility games for kids aged 3-8 with active dads.',
    hostId: 'seed-dad-1',
    hostName: 'Vikram Rao',
    hostRole: 'Father of 5-year-old',
    hostGender: 'Father',
    isVirtual: false,
    locationName: 'Sarjapur Sports Turf, Bengaluru',
    date: '2026-09-13',
    time: '07:30 AM - 09:00 AM',
    genderRestriction: 'Male Only',
    maxAttendees: 20,
    rsvpUserIds: ['seed-dad-1'],
    rsvpCount: 14,
    category: 'Sports & Play'
  },
  {
    id: 'host-4',
    title: 'Montessori Sensory Playgroup at Home Garden 🌿',
    description: 'Sensory bins with colored rice, water play, and finger painting for toddlers aged 1.5 to 3 years.',
    hostId: 'seed-mom-4',
    hostName: 'Shalini Gupta',
    hostRole: 'Montessori Mom',
    hostGender: 'Mother',
    isVirtual: false,
    locationName: 'Indiranagar 12th Main, Bengaluru',
    date: '2026-09-19',
    time: '10:00 AM - 12:00 PM',
    genderRestriction: 'Both',
    maxAttendees: 10,
    rsvpUserIds: ['seed-mom-4'],
    rsvpCount: 7,
    category: 'Sensory Play'
  }
];

export function CommunityHostingHub({ userProfile }: CommunityHostingHubProps) {
  const [hosts, setHosts] = useState<CommunityHostMeetup[]>(() => {
    try {
      const saved = localStorage.getItem('vernunt_community_hosts');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_HOSTS;
  });

  const [filterType, setFilterType] = useState<'all' | 'physical' | 'virtual'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Host Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [locationName, setLocationName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [genderRestriction, setGenderRestriction] = useState<'Female Only' | 'Male Only' | 'Both'>('Female Only');
  const [category, setCategory] = useState('Playdate');
  const [maxAttendees, setMaxAttendees] = useState(15);

  const currentUserId = userProfile?.id || 'demo-user-1';
  const currentUserName = userProfile?.parentName || 'Vernunt Parent';
  const currentUserGender = userProfile?.parentGender || 'Mother';

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem('vernunt_community_hosts', JSON.stringify(hosts));
    } catch (e) {
      console.error(e);
    }
  }, [hosts]);

  // Gender safety filtering:
  // Male users cannot view "Female Only" meetups, and Female users cannot view "Male Only" meetups.
  const visibleHosts = hosts.filter(host => {
    if (currentUserGender === 'Father' && host.genderRestriction === 'Female Only') return false;
    if (currentUserGender === 'Mother' && host.genderRestriction === 'Male Only') return false;

    if (filterType === 'physical' && host.isVirtual) return false;
    if (filterType === 'virtual' && !host.isVirtual) return false;

    return true;
  });

  const handleToggleRsvp = (hostId: string) => {
    setHosts(prev => prev.map(h => {
      if (h.id === hostId) {
        const userList = h.rsvpUserIds || [];
        const hasRsvp = userList.includes(currentUserId);
        const nextIds = hasRsvp 
          ? userList.filter(id => id !== currentUserId)
          : [...userList, currentUserId];
        if (!hasRsvp) confetti({ particleCount: 35, spread: 60 });
        return {
          ...h,
          rsvpUserIds: nextIds,
          rsvpCount: hasRsvp ? Math.max(0, (h.rsvpCount || 1) - 1) : (h.rsvpCount || 0) + 1
        };
      }
      return h;
    }));
  };

  const handleCreateHost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newHost: CommunityHostMeetup = {
      id: `host-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      hostId: currentUserId,
      hostName: currentUserName,
      hostRole: `${userProfile?.childName || 'Child'}'s Parent`,
      hostGender: currentUserGender,
      isVirtual,
      meetingUrl: isVirtual ? (meetingUrl || 'https://meet.google.com/ver-nunt') : undefined,
      locationName: isVirtual ? undefined : (locationName || 'Bengaluru Local Park'),
      date: date || 'Upcoming Saturday',
      time: time || '10:00 AM',
      genderRestriction,
      maxAttendees: Number(maxAttendees) || 15,
      rsvpUserIds: [currentUserId],
      rsvpCount: 1,
      category
    };

    setHosts([newHost, ...hosts]);
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    confetti({ particleCount: 50, spread: 70 });
  };

  return (
    <div id="community-hosting-hub" className="w-full max-w-5xl mx-auto space-y-6 font-sans pb-12 animate-fade-in text-left">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-rose-500/30 text-rose-200 px-3 py-1 rounded-full text-xs font-extrabold border border-rose-400/30">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Vernunt Community Hosting</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
            Parent-Hosted Meetups &amp; Virtual Circles
          </h1>

          <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
            Host or join neighborhood stroller walks, backyard Montessori sessions, or drop into virtual Google Meet video calls with other moms and dads.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              id="btn-create-host"
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-md hover:scale-102 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Host a Meetup or Virtual Call</span>
            </button>
          </div>
        </div>

        <div className="absolute right-4 bottom-2 text-white/5 text-9xl font-black select-none pointer-events-none">
          ☕
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
              filterType === 'all' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Hosting
          </button>
          <button
            type="button"
            onClick={() => setFilterType('physical')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              filterType === 'physical' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Physical Meetups</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('virtual')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              filterType === 'virtual' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>Virtual Video Calls</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-bold">
          Showing {visibleHosts.length} verified hostings
        </span>
      </div>

      {/* Host Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleHosts.map((host) => {
          const isUserRsvpd = host.rsvpUserIds?.includes(currentUserId) ?? false;
          return (
            <div
              key={host.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      host.isVirtual 
                        ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                        : 'bg-amber-100 text-amber-900 border border-amber-200'
                    }`}>
                      {host.isVirtual ? <Video className="w-3 h-3 text-purple-700" /> : <MapPin className="w-3 h-3 text-amber-700" />}
                      <span>{host.isVirtual ? 'Virtual Video Call' : 'In-Person Meetup'}</span>
                    </span>

                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {host.category}
                    </span>
                  </div>

                  {/* Gender Restriction badge */}
                  <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    {host.genderRestriction}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-serif font-black text-slate-900 text-base sm:text-lg leading-snug">
                    {host.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-normal">
                    {host.description}
                  </p>
                </div>

                {/* Location / Video Call Link & Date */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{host.date} • {host.time}</span>
                  </div>

                  {host.isVirtual ? (
                    <div className="flex items-center gap-2 text-purple-700 font-bold">
                      <Video className="w-3.5 h-3.5" />
                      <span>Google Meet Video Link Included</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{host.locationName}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 pt-1">
                    Hosted with love by <strong>{host.hostName}</strong> ({host.hostRole})
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{host.rsvpCount} Attending / Max {host.maxAttendees}</span>
                </span>

                <div className="flex items-center gap-2">
                  {host.isVirtual && isUserRsvpd && host.meetingUrl && (
                    <a
                      href={host.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black py-2 px-3 rounded-xl transition flex items-center gap-1 shadow-2xs"
                    >
                      <span>Join Call</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleRsvp(host.id)}
                    className={`text-xs font-black py-2 px-4 rounded-xl transition cursor-pointer shadow-xs ${
                      isUserRsvpd
                        ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                        : 'bg-rose-700 hover:bg-rose-800 text-white'
                    }`}
                  >
                    {isUserRsvpd ? '✓ Attending' : 'RSVP Now'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Host */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider block">
                  Vernunt Community
                </span>
                <h3 className="text-base font-black text-slate-900 font-serif">
                  Host a Meetup or Virtual Circle
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHost} className="space-y-3">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsVirtual(false)}
                  className={`p-2.5 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isVirtual ? 'bg-rose-50 border-rose-500 text-rose-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>Physical Park / Cafe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVirtual(true)}
                  className={`p-2.5 rounded-xl border text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    isVirtual ? 'bg-purple-50 border-purple-500 text-purple-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>Virtual Video Call</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meetup Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Morning Stroller Walk at Cubbon Park"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What's the plan? What should parents bring?"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {isVirtual ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Google Meet / Video Link</label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / Venue *</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Cubbon Park Bandstand, Bengaluru"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="e.g. This Saturday"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Time *</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full text-xs p-2 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              {/* Gender Restriction */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attendee Restriction *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setGenderRestriction('Female Only')}
                    className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      genderRestriction === 'Female Only' ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    👩 Moms Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderRestriction('Male Only')}
                    className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      genderRestriction === 'Male Only' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    👨 Dads Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderRestriction('Both')}
                    className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      genderRestriction === 'Both' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    👨‍👩‍👧 All Parents
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-slate-500 px-3 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-700 hover:bg-rose-800 text-white font-black text-xs py-2.5 px-5 rounded-xl cursor-pointer"
                >
                  Publish Hosting ✨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
