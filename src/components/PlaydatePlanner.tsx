import React, { useState, useEffect } from 'react';
import { ChildProfile, Playdate } from '../types.ts';
import { CalendarRange, CalendarCheck2, MapPin, Clock, Trash2, HeartHandshake, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { auth, db, handleFirestoreError, OperationType } from '../utils/firebase.ts';
import { onSnapshot, collection, query, where, or, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { PlaydateActivitySuggestions } from './PlaydateActivitySuggestions.tsx';

interface PlaydatePlannerProps {
  playmates: ChildProfile[];
  userProfile: ChildProfile | null;
  activeCompanion: ChildProfile | null;
}

export default function PlaydatePlanner({ playmates, userProfile, activeCompanion }: PlaydatePlannerProps) {
  // Local list of playdates
  const [playdates, setPlaydates] = useState<Playdate[]>([]);

  // Real-time Firestore synchronisation for logged in users
  useEffect(() => {
    if (!auth.currentUser) {
      // In sandbox mode, initialize with demo playdates
      setPlaydates([
        {
          id: 'date-1',
          hostId: 'user-0',
          guestId: 'playmate-1',
          title: 'Lego Building at Central Park West',
          date: '2026-06-02',
          time: '09:00',
          location: 'Central Park West picnic lawns',
          status: 'Accepted',
          notes: 'Please bring Liam\'s favorite crayon set! We will bring organic apple slices and water bottles.',
        },
        {
          id: 'date-2',
          hostId: 'user-0',
          guestId: 'playmate-2',
          title: 'Soccer Sprints & Relay Drills',
          date: '2026-06-08',
          time: '16:30',
          location: 'Washington Square Park play area',
          status: 'Pending',
          notes: 'Chloe has a mini soccer goal we can set up on the grass field.',
        }
      ]);
      return;
    }

    const q = query(
      collection(db, 'playdates'),
      or(
        where('hostId', '==', auth.currentUser.uid),
        where('guestId', '==', auth.currentUser.uid)
      )
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Playdate[] = [];
      snapshot.forEach((snapshotDoc) => {
        list.push(snapshotDoc.data() as Playdate);
      });
      setPlaydates(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'playdates');
    });

    return () => unsubscribe();
  }, [userProfile]);

  // Form State
  const [guestId, setGuestId] = useState(activeCompanion?.id || playmates[0]?.id || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [plannerTitle, setPlannerTitle] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestId || !date || !time || !locationName) {
      alert('Please fill out all required fields.');
      return;
    }

    const matchedCompanion = playmates.find(p => p.id === guestId);
    const guestChildName = matchedCompanion ? matchedCompanion.childName : 'Playmate';

    const cleanHostId = auth.currentUser?.uid || userProfile?.id || 'user-0';

    const newRequest: Playdate = {
      id: `request-${Date.now()}`,
      title: plannerTitle.trim() || `Playdate with ${guestChildName}`,
      hostId: cleanHostId,
      guestId,
      date,
      time,
      location: locationName.trim(),
      status: 'Pending',
      notes: meetingNotes.trim()
    };

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'playdates', newRequest.id), newRequest);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `playdates/${newRequest.id}`);
      }
    } else {
      setPlaydates([newRequest, ...playdates]);
    }

    setNotification(`Successfully sent playdate request to ${guestChildName}'s parent!`);
    setTimeout(() => setNotification(null), 4000);

    // Celebrate with elegant confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.85 }
    });

    // Reset fields
    setPlannerTitle('');
    setLocationName('');
    setMeetingNotes('');
  };

  const handleDeclineRequest = async (id: string) => {
    if (auth.currentUser) {
      try {
        await deleteDoc(doc(db, 'playdates', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `playdates/${id}`);
      }
    } else {
      setPlaydates(playdates.filter(d => d.id !== id));
    }
  };

  const handleApprovePendingRequest = async (id: string) => {
    const targetPlaydate = playdates.find(d => d.id === id);
    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'playdates', id), { status: 'Accepted' });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `playdates/${id}`);
      }
    } else {
      setPlaydates(playdates.map(d => {
        if (d.id === id) {
          return { ...d, status: 'Accepted' };
        }
        return d;
      }));
    }

    // Google Chat Workspace bot playdate confirmation notification
    const config = (userProfile as any)?.googleChatConfig;
    if (targetPlaydate && config?.webhookUrl && config?.autoSyncPlaydates) {
      try {
        const text = `📅 *NEW PLAYDATE SCHEDULE ALIGNED* 🤝\n*Guardians:* ${targetPlaydate.requesterParentName} & ${targetPlaydate.inviteeParentName}\n*Children:* ${targetPlaydate.requesterChildName} & ${targetPlaydate.inviteeChildName}\n*Activity:* ${targetPlaydate.proposedActivity || 'Neighborhood Walk'}\n*Date & Time:* ${targetPlaydate.dateTime}\n*Location:* ${targetPlaydate.locationName || 'Local Park'}\n*Status:* Confirmed and approved!`;
        fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        }).catch(err => console.warn('Bot webhook sync error:', err));
      } catch (err) {
        console.warn('Webhook prepare failed', err);
      }
    }

    confetti({
      particleCount: 50,
      spread: 40,
      colors: ['#f97316', '#fbbf24']
    });
  };

  return (
    <div id="playdate-planner-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1 & 2: Main Schedule Overviews & Request Creation */}
      <div id="planner-main-column" className="lg:col-span-2 space-y-6">
        {notification && (
          <div id="notification-banner" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl animate-bounce flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            {notification}
          </div>
        )}

        {/* AI & Activity Suggestion Engine */}
        <PlaydateActivitySuggestions 
          userProfile={userProfile}
          targetChild={activeCompanion || playmates.find(p => p.id === guestId) || null}
          allPlaymates={playmates}
          onSelectActivityForPlaydate={(activityTitle, location, notes, companionId) => {
            if (activityTitle) setPlannerTitle(activityTitle);
            if (location) setLocationName(location);
            if (notes) setMeetingNotes(notes);
            if (companionId) setGuestId(companionId);
            setNotification(`✨ Populated "${activityTitle}" into the schedule proposal form below! Choose date & time to confirm.`);
            setTimeout(() => setNotification(null), 5000);
          }}
        />

        {/* Propose/Book New Playdate Invitation */}
        <div id="propose-invitation-card" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div id="req-header" className="flex items-center gap-2 text-slate-800 mb-2">
            <CalendarRange className="w-5.5 h-5.5 text-orange-500" />
            <h3 className="font-bold text-lg font-serif">Propose Playground Playdate</h3>
          </div>

          <form id="invite-form" onSubmit={handleSubmitRequest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div id="field-invite-title" className="flex flex-col space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Interactive playdate Title</label>
              <input
                id="input-plan-title"
                type="text"
                value={plannerTitle}
                onChange={(e) => setPlannerTitle(e.target.value)}
                placeholder="e.g. Lego Building & Drawing Afternoon"
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
              />
            </div>

            <div id="field-invite-child" className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Select Companion</label>
              <select
                id="select-companion-guest"
                value={guestId}
                onChange={(e) => setGuestId(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
              >
                {playmates.map(p => (
                  <option key={p.id} value={p.id}>{p.childName} ({p.gradeLevel})</option>
                ))}
              </select>
            </div>

            {/* Visual availability advisor for selected companion */}
            {guestId && (() => {
              const companion = playmates.find(p => p.id === guestId);
              if (!companion || (!companion.availableDays && !companion.availableTimes)) return null;
              return (
                <div className="md:col-span-2 bg-sky-50 pb-2.5 pt-2.5 px-3.5 rounded-xl border border-sky-100 flex flex-col gap-1.5 animate-fade-in text-xs">
                  <span className="text-[10px] font-extrabold text-sky-800 uppercase tracking-widest">
                    🗓️ Preferred Playdate Slots for {companion.childName}
                  </span>
                  <div className="flex flex-col md:flex-row md:items-center gap-2.5 text-[11px] text-sky-950 font-medium">
                    {companion.availableDays && companion.availableDays.length > 0 && (
                      <div>
                        <span className="text-slate-500 font-bold mr-1">Days:</span>
                        <span className="font-extrabold text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200 text-[10px] inline-block">
                          {companion.availableDays.join(', ')}
                        </span>
                      </div>
                    )}
                    {companion.availableTimes && companion.availableTimes.length > 0 && (
                      <div>
                        <span className="text-slate-500 font-bold mr-1">Times:</span>
                        <span className="font-extrabold text-orange-750 bg-white px-2 py-0.5 rounded-md border border-orange-200 text-[10px] inline-block">
                          {companion.availableTimes.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div id="field-invite-location" className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Meeting Playground / Area</label>
              <input
                id="input-plan-location"
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Westside Gated Playground Park"
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
              />
            </div>

            <div id="field-invite-date" className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Choose Date</label>
              <input
                id="input-plan-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
              />
            </div>

            <div id="field-invite-time" className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Start Time</label>
              <input
                id="input-plan-time"
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
              />
            </div>

            <div id="field-invite-notes" className="flex flex-col space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-600 uppercase">Parents' notes & Friendly alerts</label>
              <textarea
                id="input-plan-notes"
                rows={2}
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Share any toy preferences, sibling notes, food sensitivities, or parent agreements..."
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-orange-200 focus:bg-white transition"
              />
            </div>

            <button
              id="btn-submit-proposal"
              type="submit"
              className="md:col-span-2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-95 transition pointer-events-auto"
            >
              Propose Scheduled Playdate Invitation
            </button>
          </form>
        </div>
      </div>

      {/* Column 3: Playdate Lists & Invites */}
      <div id="schedules-right-column" className="space-y-6">
        <div id="active-schedules-card" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div id="sch-header-line" className="flex items-center gap-2 text-slate-800">
            <CalendarCheck2 className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="font-bold text-base font-serif">Schedules & Meets</h3>
          </div>

          <div id="schedules-list" className="space-y-3">
            {playdates.map((d) => {
              const childMatched = playmates.find(p => p.id === d.guestId);
              const childName = childMatched ? childMatched.childName : 'Playmate';
              const childPhoto = childMatched ? childMatched.photoUrl : '';

              const isPending = d.status === 'Pending';
              
              return (
                <div id={`playdate-item-${d.id}`} key={d.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      {childPhoto && <img src={childPhoto} alt={childName} className="w-8 h-8 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />}
                      <div>
                        <span className="block text-xs font-bold text-slate-800">{d.title}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Meeting with: {childName}</span>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${d.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {d.status}
                    </span>
                  </div>

                  {/* Detail Metrics fields */}
                  <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.location}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="flex items-center gap-1">
                        <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.time}</span>
                      </div>
                    </div>
                  </div>

                  {d.notes && (
                    <p className="text-[10px] bg-white p-2.5 rounded-xl border border-dashed border-slate-150 text-slate-500">
                      "{d.notes}"
                    </p>
                  )}

                  {isPending ? (
                    <div id={`pending-actions-${d.id}`} className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <button
                        id={`btn-approve-date-${d.id}`}
                        onClick={() => handleApprovePendingRequest(d.id)}
                        type="button"
                        className="py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] tracking-wide uppercase transition hover:shadow-sm"
                      >
                        Accept
                      </button>
                      <button
                        id={`btn-decline-date-${d.id}`}
                        onClick={() => handleDeclineRequest(d.id)}
                        type="button"
                        className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px] tracking-wide uppercase transition"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div id={`accepted-actions-${d.id}`} className="flex justify-end pt-1">
                      <button
                        id={`btn-delete-date-${d.id}`}
                        onClick={() => handleDeclineRequest(d.id)}
                        type="button"
                        className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 font-semibold hover:underline"
                      >
                        <Trash2 className="w-3 h-3" /> Cancel playdate
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
